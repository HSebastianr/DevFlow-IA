import { NextApiRequest, NextApiResponse } from "next";

interface ApiResponse {
  choices?: { message: { content: string } }[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { description } = req.body;

  if (!description) {
    res.status(400).json({ error: "La descripción es obligatoria" });
    return;
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-preview-02-05:free",
          messages: [{ role: "user", content: description }],
          max_tokens: 10000,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      res.status(response.status).json({
        error: "Error en la respuesta de la API",
        details: errorData,
      });
      return;
    }

    const data: ApiResponse = await response.json();

    if (data.choices?.length) {
      res.status(200).json({ code: data.choices[0].message.content });
    } else {
      res.status(500).json({
        error: "No se pudo generar el código",
        details: data,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Error en la solicitud a la API",
      details: (error as Error).message,
    });
  }
}
