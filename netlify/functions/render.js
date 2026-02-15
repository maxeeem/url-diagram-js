const plantumlEncoder = require("plantuml-encoder");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const code = data.code;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Код диаграммы обязателен" }),
      };
    }

    const encoded = plantumlEncoder.encode(code);
    const imageUrl = `http://www.plantuml.com/plantuml/img/${encoded}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ image_url: imageUrl }),
    };
  } catch (error) {
    console.error("Error rendering:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
