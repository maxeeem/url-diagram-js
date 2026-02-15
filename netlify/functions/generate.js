const { OpenAI } = require("openai");
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
    const description = data.description;
    const accessCode = data.access_code;

    if (!description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Описание обязательно" }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API ключ OpenAI не настроен на сервере" }),
      };
    }

    const serverAccessCode = process.env.ACCESS_CODE;
    if (serverAccessCode && accessCode !== serverAccessCode) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Неверный код доступа" }),
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Задача: тебе нужно сделать UML диаграмму в формате кода PlantUML для Use Case: ${description}`;
    const system = `Работай как опытный системный аналитик с опытом создания UML Sequence диаграмм более 15 лет. 

Генерация PlantUML для UML-Sequence диаграммы должна быть по предоставленному Use Case.

На UML-диаграмме покажи:
+ всех участников процесса: пользователи, веб-приложения, Backend, внешние системы. Если в тексте Use Case есть описание микросервисов, сервисов, файловых хранилищ, брокеров и баз данных, то показывай их отдельно.
+ В PlantUML при описании участников базы данные - database, брокер - queue 
+ бары активации - когда события начинается и завершается. Важно - если бар активации открылся, то он должен быть деактивирован, как процесс закончится.
+ может быть так, что компонент запустит функцию внутри себя и тогда будут два бара активации.

+ Если компонент вызывает сам себя, то должен быть тоже бар активации поверх другого бара активации.
Пример:
activate Backend
....
Backend -> Backend Сгенерировать новый пароль
activate Backend
deactivate Backend
...
deactivate Backend
+ Все линии жизни должны иметь бары активации, когда они начинают работать. Самый первый бар, который начинает запускать первое событие - тоже.
+ вправо обычные стрелки ->, которые подписаны глаголами и названиями вызовов конкретных методов, если это нужно и методы есть в тексте. Если метода к бэкенду нет, но он должен быть, подставь [рекомендуется указать API метод] на языке описания use case. Пример: Зарегистрировать пользователя POST /users.
+ стрелки ответов (сообщений в ответ на запросы) должны быть пунктирные -->. В ответ всегда данные или сообщения.
+ показывать альтернативные сценарии и обработку ошибок, если только это есть в описании Use Case. Иначе - не надо.
+ На брокерах бары активации не делать
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "diagram_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              plantuml_code: {
                type: "string",
                description: "Сырой код PlantUML, начинающийся с @startuml и заканчивающийся @enduml"
              },
              diagram_type: {
                type: "string",
                description: "Тип созданной диаграммы на русском языке (например: Диаграмма последовательности, Диаграмма классов)"
              },
              explanation: {
                type: "string",
                description: "Краткое объяснение логики и компонентов диаграммы на русском языке"
              }
            },
            required: ["plantuml_code", "diagram_type", "explanation"],
            additionalProperties: false
          }
        }
      }
    });

    const responseContent = completion.choices[0].message.content;
    let responseObj;
    try {
        responseObj = JSON.parse(responseContent);
    } catch (e) {
        console.error("Failed to parse JSON response", responseContent);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to parse AI response" })
        };
    }

    let pumlCode = responseObj.plantuml_code.trim();

    // Ensure start/end tags are present
    if (!pumlCode.startsWith("@startuml")) {
      pumlCode = "@startuml\n" + pumlCode;
    }
    if (!pumlCode.endsWith("@enduml")) {
      pumlCode = pumlCode + "\n@enduml";
    }

    const encoded = plantumlEncoder.encode(pumlCode);
    const imageUrl = `http://www.plantuml.com/plantuml/img/${encoded}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        code: pumlCode,
        image_url: imageUrl,
        diagram_type: responseObj.diagram_type,
        explanation: responseObj.explanation,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
