/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini AI client successfully initialized!');
  } catch (error) {
    console.error('Failed to initialize Gemini AI Client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY is not configured or holds a placeholder. Healthy recipes will use a rich, curated database instead.');
}

/// -------------------------------------------------------------
// CURATED BACKUP RECIPES DATABASE (fallback)
// -------------------------------------------------------------
const fallbackRecipes: Record<string, any[]> = {
  dog: [
    {
      titulo: "Biscoito de Abóbora e Aveia Calminho",
      descricao: "Biscoito crocante e calminho de abóbora e aveia orgânica.",
      ingredientes: [
        "1 xícara de purê de abóbora cozida (sem açúcar ou sal)",
        "2 ovos inteiros",
        "2 e 1/2 xícaras de farinha de aveia",
        "1 colher de sopa de mel orgânico de alta qualidade"
      ],
      modoPreparo: "1. Pré-aqueça o forno a 180°C e forre uma forma com papel manteiga.\n2. Misture a abóbora, os ovos e o mel em uma tigela grande até obter uma consistência uniforme.\n3. Adicione a farinha de aveia gradualmente e misture até formar uma massa firme que possa ser esticada.\n4. Abra a massa na espessura de 0.5cm e corte nos formatos que desejar.\n5. Asse por 25 a 30 minutos até que estejam dourados e crocantes.\n6. Deixe esfriar completamente antes de servir ao seu cãozinho.",
      beneficios: "Rico em fibras naturais, auxilia no trânsito intestinal e fornece vitamina A de fácil digestão, excelente para o pelo."
    },
    {
      titulo: "Sorvete Saudável de Banana e Iogurte",
      descricao: "Sorvete refrescante sem conservantes ou adoçantes para os dias mais quentes.",
      ingredientes: [
        "2 bananas maduras amassadas",
        "2 potes de iogurte natural desnatado (sem açúcar ou adoçantes)",
        "1 colher de chá de óleo de coco"
      ],
      modoPreparo: "1. Bata todos os ingredientes no liquidificador até obter um creme bem liso.\n2. Despeje em formas de silicone divertidas (como patinhas ou ossos).\n3. Coloque para congelar por pelo menos 4 horas.\n4. Ofereça nos dias quentes de verão como um petisco refrescante.",
      beneficios: "Excelente fonte de potássio, probióticos saudáveis para a flora estomacal e gordura benéfica do óleo de coco."
    }
  ],
  cat: [
    {
      titulo: "Patê Premium de Atum e Abobrinha",
      descricao: "Patê premium úmido de atum com abobrinhas higienizadas.",
      ingredientes: [
        "1 lata de atum em água escorrido (sem óleo ou sal adicionado)",
        "2 colheres de sopa de abobrinha ralada finamente",
        "1 colher de chá de gelatina incolor hidratada",
        "1 colher de sopa de caldo de galinha caseiro (sem cebola ou temperos)"
      ],
      modoPreparo: "1. Misture a gelatina hidratada no caldo caseiro morno até dissolver.\n2. No processador ou liquidificador, junte o atum, a abobrinha ralada e o caldo morno.\n3. Processe até que a consistência atinja um patê cremoso e suave.\n4. Armazene em um recipiente de vidro na geladeira por até 3 dias.\n5. Sirva em temperatura ambiente para maior bem-estar do felino.",
      beneficios: "Alta hidratação (crucial para a saúde urinária dos gatos) e rico em ômega-3 e fibras de fácil processamento."
    },
    {
      titulo: "Petiscos Crocantes de Salmão",
      descricao: "Petiscos saudáveis e crocantes com ácidos graxos ômega-3.",
      ingredientes: [
        "150g de salmão cozido e desfiado",
        "1 ovo levemente batido",
        "1 xícara de farinha de aveia fina"
      ],
      modoPreparo: "1. Pré-aqueça o forno a 170°C.\n2. Misture o salmão com o ovo até criar uma mistura pastosa.\n3. Vá adicionando a aveia até virar uma massa homogênea.\n4. Molde em mini bolinhas menores que uma uva para evitar engasgos.\n5. Asse por 15 minutos até que fiquem levemente crocantes por fora.",
      beneficios: "Contém ácidos graxos essenciais que promovem pelagem brilhante e dão suporte às articulações de gatos idosos."
    }
  ],
  capybara: [
    {
      titulo: "Banquete Verde de Capivara Realeza",
      descricao: "Prato especial de feno, sementes e melancia crocante.",
      ingredientes: [
        "Fatias generosas de melancia inteira com casca",
        "Ramos viçosos de capim-santo fresco",
        "Rolo de feno de alfafa fresca",
        "Cubinhos de abóbora cabotiá crua"
      ],
      modoPreparo: "1. Lave higienicamente todas as folhas e legumes em água corrente abundante.\n2. Corte a abóbora em cubos pequenos para facilitar a mastigação contínua.\n3. Disponha o feno como base do prato.\n4. Coloque as fatias de melancia e decore com os ramos de capim-santo e os cubos de abóbora.\n5. Sirva fresco de preferência perto de água limpa.",
      beneficios: "Alimenta os dentes de crescimento contínuo das capivaras e assegura alto teor de água e fibras adequados aos roedores."
    }
  ],
  generic: [
    {
      titulo: "Mix Nutritivo Universal para Pets",
      descricao: "Mix crocante e nutritivo de legumes cozidos no vapor.",
      ingredientes: [
        "1 maçã média sem sementes e sem miolo picada",
        "1 cenoura cozida a vapor e cortada em rodelas bem finas",
        "2 ramos de salsa higienizada fresca picadinha"
      ],
      modoPreparo: "1. Certifique-se de remover todas as sementes da maçã, que são tóxicas.\n2. Cozinhe a cenoura no vapor até ficar bem macia e fácil de mastigar.\n3. Misture todos os ingredientes em um pote livre de contaminantes.\n4. Sirva em pequenas porções misturado à alimentação rotineira.",
      beneficios: "Vitaminas A, B e C, refresca o hálito graças à salsa e ajuda a limpar e depurar toxinas naturalmente."
    }
  ]
};

// -------------------------------------------------------------
// POST /api/recipes
// -------------------------------------------------------------
app.post('/api/recipes', async (req, res) => {
  const { petType } = req.body;
  if (!petType) {
    return res.status(400).json({ error: 'O tipo do pet é obrigatório.' });
  }

  const normalized = petType.toLowerCase().trim();

  // If Gemini is available, generate dynamically!
  if (ai) {
    try {
      console.log(`Generating healthy recipe using Gemini AI for pet type: ${petType}...`);
      const prompt = `Crie uma receita saudável, segura e nutritiva para um pet do tipo "${petType}".
O animal pode ser um cão, gato, papagaio, capivara, coelho, porquinho-da-índia ou qualquer outro.
Assegure-se de que os ingredientes sejam 100% seguros para essa espécie (NUNCA inclua ingredientes perigosos como chocolate, cebola, alho, uvas ou sementes tóxicas).
Forneça a resposta em formato JSON estrito, utilizando EXATAMENTE a estrutura descrita no schema abaixo.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Você é um veterinário sênior especialista em nutrição animal. Você cria receitas saudáveis, práticas e deliciosas sob medida para qualquer pet.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titulo: { type: Type.STRING, description: 'Título chamativo e amigável da receita.' },
              descricao: { type: Type.STRING, description: 'Breve descrição do prato e por que é delicioso.' },
              ingredientes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de ingredientes seguros com quantidades exatas.'
              },
              modoPreparo: { type: Type.STRING, description: 'Modo de preparo passo a passo detalhado como uma única string (você pode incluir quebras de linha com \\n).' },
              beneficios: { type: Type.STRING, description: 'Explicação curta de qual o benefício de saúde dessa receita para essa espécie específica.' }
            },
            required: ['titulo', 'descricao', 'ingredientes', 'modoPreparo', 'beneficios']
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const recipe = JSON.parse(responseText.trim());
        return res.json({ recipe, source: 'ai' });
      }
    } catch (error) {
      console.error('Gemini API generation error, falling back to curated list:', error);
    }
  }

  // --- FALLBACK ALGORITHM ---
  console.log(`Using offline curated fallback database for pet type: ${normalized}`);
  let category = 'generic';
  if (normalized.includes('gato') || normalized.includes('cat') || normalized.includes('felin')) {
    category = 'cat';
  } else if (normalized.includes('cão') || normalized.includes('cao') || normalized.includes('cachor') || normalized.includes('dog') || normalized.includes('vira-lata')) {
    category = 'dog';
  } else if (normalized.includes('capivara') || normalized.includes('capy')) {
    category = 'capybara';
  }

  const list = fallbackRecipes[category];
  const selected = list[Math.floor(Math.random() * list.length)];

  res.json({
    recipe: selected,
    source: 'local_database'
  });
});

// -------------------------------------------------------------
// VITE OR STATIC FILE SERVING MIDDLEWARE
// -------------------------------------------------------------
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Vite loaded in development middleware mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production build file server setup active.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Petzy dev server running at http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start Petzy application server:', err);
});
