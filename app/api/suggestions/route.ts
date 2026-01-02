import { NextResponse } from 'next/server';

const MODEL = 'deepseek-chat';

type Payload = {
  name: string;
  tone: 'professional' | 'playful' | 'edgy';
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube';
};

const toneDescriptions: Record<Payload['tone'], string> = {
  professional: 'polished, trustworthy, business-forward voice',
  playful: 'creative, upbeat, quirky voice',
  edgy: 'bold, daring, slightly rebellious voice'
};

const platformGuidance: Record<Payload['platform'], string> = {
  instagram: 'optimized for Instagram handle rules (30 chars max, letters, numbers, underscores, periods).',
  twitter: 'optimized for X/Twitter handle rules (15 chars max, letters, numbers, underscores).',
  tiktok: 'optimized for TikTok handle rules (24 chars max, letters, numbers, underscores, periods).',
  youtube: 'optimized for YouTube handle rules (30 chars max, lowercase letters, numbers, underscores, periods).'
};

export async function POST(request: Request) {
  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const name = (payload.name ?? '').trim();
  if (name.length < 2) {
    return NextResponse.json({ error: 'Name must be at least two characters long.' }, { status: 400 });
  }

  const tone: Payload['tone'] = payload.tone ?? 'professional';
  const platform: Payload['platform'] = payload.platform ?? 'instagram';

  const key = process.env.DEEPSEEK_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: 'DeepSeek API key is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const body = {
      model: MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are HandleCraft, an expert branding assistant who crafts memorable, platform-ready social media usernames. Respond strictly with JSON.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                `Target name: "${name}".`,
                `Desired tone: ${toneDescriptions[tone]}.`,
                `Target platform: ${platformGuidance[platform]}`,
                'Produce 5 unique username suggestions that respect the character rules and keep the name recognizable.',
                'Return JSON with the schema: { "suggestions": [ { "handle": string, "rationale": string } ] }.'
              ].join(' ')
            }
          ]
        }
      ]
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const message =
        (errorPayload && typeof errorPayload.error === 'object' && errorPayload.error !== null
          ? errorPayload.error.message
          : null) ?? response.statusText;
      return NextResponse.json({ error: `DeepSeek request failed: ${message}` }, { status: response.status });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'DeepSeek returned an empty response.' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'DeepSeek response was not valid JSON. Try again.' },
        { status: 502 }
      );
    }

    const suggestions = validateSuggestions(parsed);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to contact agent.' }, { status: 502 });
  }
}

function validateSuggestions(input: unknown) {
  if (typeof input !== 'object' || input === null || !('suggestions' in input)) {
    throw new Error('Missing suggestions in response.');
  }

  const raw = (input as { suggestions: unknown }).suggestions;

  if (!Array.isArray(raw)) {
    throw new Error('Suggestions should be an array.');
  }

  return raw
    .flatMap((item) => {
      if (typeof item !== 'object' || item === null) {
        return [];
      }

      const handle = 'handle' in item ? item.handle : undefined;
      const rationale = 'rationale' in item ? item.rationale : undefined;

      if (typeof handle !== 'string' || typeof rationale !== 'string') {
        return [];
      }

      return [
        {
          handle: handle.trim(),
          rationale: rationale.trim()
        }
      ];
    })
    .filter((item) => item.handle.length > 0 && item.rationale.length > 0)
    .slice(0, 5);
}
