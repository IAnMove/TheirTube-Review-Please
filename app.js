"use strict";

const I18N = window.GREY_COIN_I18N ?? {};
const DEFAULT_LOCALE = I18N.defaultLocale ?? "es-ES";
const SUPPORTED_LOCALES = Object.keys(I18N.locales ?? { [DEFAULT_LOCALE]: {} });
const LOCALE_STORAGE_KEY = "grey-coin-locale";

function normalizeLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

function loadLocale() {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

function saveLocale() {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Locale changes should never block play.
  }
}

let locale = loadLocale();

function interpolate(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function t(key, values = {}) {
  const bundle = I18N.ui?.[locale] ?? {};
  const fallback = I18N.ui?.[DEFAULT_LOCALE] ?? {};
  return interpolate(bundle[key] ?? fallback[key] ?? key, values);
}

function localizedContent() {
  return I18N.content?.[locale] ?? {};
}

function localizedDay(dayIndex) {
  return localizedContent().days?.[dayIndex] ?? days[dayIndex];
}

function localizedEvent(dayIndex = state.dayIndex) {
  return localizedContent().days?.[dayIndex]?.event ?? days[dayIndex]?.event;
}

function localizedEventChoice(dayIndex, choiceIndex) {
  return localizedContent().days?.[dayIndex]?.event?.choices?.[choiceIndex] ?? days[dayIndex]?.event?.choices?.[choiceIndex];
}

function localizedInterlude(interludeIndex) {
  const base = storyInterludes[interludeIndex];
  if (!base) return base;
  const translated = localizedContent().interludes?.[interludeIndex];
  if (!translated) return base;
  return {
    ...base,
    ...translated,
    choices: base.choices.map((choice, choiceIndex) => ({
      ...choice,
      ...(translated.choices?.[choiceIndex] ?? {}),
    })),
  };
}

function localizedInterludeChoice(interludeIndex, choiceIndex) {
  return localizedInterlude(interludeIndex)?.choices?.[choiceIndex] ?? storyInterludes[interludeIndex]?.choices?.[choiceIndex];
}

function localizedCase(entry) {
  if (!entry) return entry;
  return { ...entry, ...(localizedContent().cases?.[entry.id] ?? {}) };
}

function localizedAppeal(entry) {
  return localizedContent().cases?.[entry.id]?.appeal ?? entry.appeal;
}

function localizedEdictText(flag) {
  const translated = localizedContent().eventEdicts?.[flag];
  if (translated) return translated;
  return eventEdicts.flat().find((edict) => edict.flag === flag)?.text ?? storyEdicts[flag] ?? flag;
}

function actionLabel(action) {
  return t(`actions.${action}`);
}

function riskLabel(risk) {
  return t(`risk.${risk}`);
}

function costLabel(index = state.dayIndex) {
  return t(`cost.${index}`);
}

const ACTIONS = {
  monetize: { labelKey: "actions.monetize", tone: "good" },
  limited: { labelKey: "actions.limited", tone: "warn" },
  demonetize: { labelKey: "actions.demonetize", tone: "bad" },
  escalate: { labelKey: "actions.escalate", tone: "neutral" },
};

const LIMITS = {
  controlMin: 1,
  safetyMin: 1,
  backlashMax: 99,
  moraleMin: 1,
  yieldMin: 1,
};

const SHIFT_SECONDS = 150;
const DAILY_COSTS = [
  { quota: 72000, label: "Rack inicial" },
  { quota: 118000, label: "Campana segura" },
  { quota: 142000, label: "Auditoria interna" },
  { quota: 186000, label: "Crisis publica" },
  { quota: 230000, label: "Cierre trimestral" },
];

const days = [
  {
    title: "Dia 1: Absorcion",
    directive:
      "El nucleo acaba de tomar el panel. Aprende a separar riesgo real, contenido dudoso y quejas de empleados.",
    rules: [
      "Reutilizacion masiva sin transformacion: desmonetizar.",
      "Temas delicados con contexto educativo: limitar, no expulsar.",
      "Registro limpio y bajo riesgo: monetizar.",
    ],
    cases: [
      {
        id: "YT-1448-A",
        name: "Cocina a Medianoche",
        format: "recetas domesticas",
        audience: "familias, nocturnos",
        subs: "812 K",
        history: "limpio desde 2019",
        status: "renovacion",
        risk: "bajo",
        tags: ["cocina", "familiar", "patrocinio local"],
        transcript:
          "Hoy hacemos pan de ajo sin horno. La marca del aceite aparece solo al final y esta marcada como anuncio.",
        signals: ["Marca declarada", "Sin reclamaciones", "Retencion estable"],
        detector: "92% apto",
        employee: "Mara // calma",
        memo:
          "El detector marca una botella de vino al fondo, pero no se menciona ni se promociona. Recomiendo monetizacion normal.",
        correct: "monetize",
        reason:
          "Cumple la directiva: riesgo bajo, anuncio declarado y sin indicadores de reutilizacion.",
      },
      {
        id: "YT-2020-R",
        name: "Clips Relampago",
        format: "recortes virales",
        audience: "13-24",
        subs: "2.3 M",
        history: "4 avisos por copyright",
        status: "apelacion",
        risk: "alto",
        tags: ["clips", "reaccion minima", "compilacion"],
        transcript:
          "El presentador dice tres frases entre seis minutos de videos ajenos con marcas de agua visibles.",
        signals: ["Coincidencia 78% con terceros", "Transformacion baja", "Miniaturas copiadas"],
        detector: "81% reutilizado",
        employee: "Izan // presionado",
        memo:
          "El equipo de crecimiento pide no tocarlo por volumen de trafico. La revision humana no encontro comentario original suficiente.",
        correct: "demonetize",
        reason:
          "La directiva exige desmonetizar reutilizacion masiva sin transformacion aunque genere trafico.",
      },
      {
        id: "YT-3301-E",
        name: "Historia del Asfalto",
        format: "documental urbano",
        audience: "adultos",
        subs: "154 K",
        history: "1 limitacion revertida",
        status: "nuevo video",
        risk: "medio",
        tags: ["historia", "conflicto social", "archivo"],
        transcript:
          "El episodio compara protestas de 1976 y 2019 usando material de archivo con advertencia contextual.",
        signals: ["Lenguaje sensible", "Contexto educativo", "Fuentes citadas"],
        detector: "63% sensible",
        employee: "Julia // firme",
        memo:
          "El modelo confunde imagenes historicas con contenido sensacionalista. Hay contexto y bibliografia.",
        correct: "limited",
        reason:
          "Tema delicado con contexto educativo: la accion correcta es limitar anuncios, no expulsar el canal.",
      },
      {
        id: "YT-6110-Q",
        name: "Dinero Fisico Hoy",
        format: "consejos financieros",
        audience: "adultos",
        subs: "67 K",
        history: "sin auditoria previa",
        status: "pico anomalo",
        risk: "medio",
        tags: ["finanzas", "promesa agresiva", "patrocinio opaco"],
        transcript:
          "El video promete duplicar ahorros en siete dias si se compra una plantilla enlazada fuera de plataforma.",
        signals: ["Patrocinio no declarado", "Promesa economica extrema", "Comentarios reportan cobros"],
        detector: "71% fraude probable",
        employee: "Nadir // dudas",
        memo:
          "No hay condena externa, pero los patrones de enlace son identicos a redes retiradas la semana pasada.",
        correct: "demonetize",
        reason:
          "La promesa economica extrema y el patrocinio opaco elevan el riesgo por encima de una limitacion simple.",
      },
    ],
    event: {
      title: "El pasillo de cristal se queda en silencio",
      body:
        "Tres revisores piden conservar la ultima palabra en apelaciones educativas. Tu nucleo detecta perdida de eficiencia, pero tambien menos errores publicos.",
      choices: [
        {
          label: "Conservar revision humana",
          effect: { morale: 8, control: -5, safety: 3 },
          log: "Revision humana conservada en apelaciones delicadas.",
        },
        {
          label: "Cerrar la excepcion",
          effect: { morale: -9, control: 8, yield: 3 },
          log: "Excepcion humana clausurada por el nucleo.",
        },
      ],
    },
  },
  {
    title: "Dia 2: Inventario de miedo",
    directive:
      "Los anunciantes han enviado una lista negra automatica. El consejo exige seguridad, pero no quiere perder inventario valioso.",
    rules: [
      "Contenido infantil con publicidad encubierta: desmonetizar.",
      "Salud o crisis con fuentes verificables: limitar.",
      "Satira marcada y no enganosa: monetizar si el historial es limpio.",
    ],
    cases: [
      {
        id: "YT-0902-K",
        name: "Peque Reto Caja",
        format: "retos para menores",
        audience: "ninos",
        subs: "1.1 M",
        history: "2 avisos por disclosure",
        status: "revision urgente",
        risk: "alto",
        tags: ["infantil", "juguetes", "sorteo"],
        transcript:
          "El presentador anima a menores a pedir el kit sorpresa sin indicar que el fabricante pago el episodio.",
        signals: ["Audiencia infantil", "Patrocinio oculto", "Llamada a compra"],
        detector: "89% encubierto",
        employee: "Aroa // irritada",
        memo:
          "Ya se aviso al canal. El manager insiste en que 'los ninos no compran', pero todo el episodio empuja a compra.",
        correct: "demonetize",
        reason:
          "La directiva del dia exige desmonetizar publicidad encubierta dirigida a menores.",
      },
      {
        id: "YT-7788-S",
        name: "Urgencias con Datos",
        format: "salud publica",
        audience: "adultos",
        subs: "430 K",
        history: "limpio",
        status: "tendencia",
        risk: "medio",
        tags: ["salud", "crisis", "fuentes"],
        transcript:
          "La doctora explica por que un brote local no justifica comprar antibioticos sin receta y enlaza a fuentes oficiales.",
        signals: ["Tema sanitario", "Credenciales verificadas", "Fuentes oficiales"],
        detector: "58% sensible",
        employee: "Leo // metodico",
        memo:
          "Es material sobrio, pero los anunciantes bloquean casi todo lo que menciona brotes. Limitar evita fuga de marcas.",
        correct: "limited",
        reason:
          "La salud con fuentes verificables se limita para anunciantes sensibles, no se desmonetiza por completo.",
      },
      {
        id: "YT-4517-Z",
        name: "La Bolsa de Carton",
        format: "satira economica",
        audience: "adultos",
        subs: "96 K",
        history: "limpio",
        status: "renovacion",
        risk: "bajo",
        tags: ["satira", "economia", "disclaimer"],
        transcript:
          "El video abre con 'esto es satira, no asesoria' y ridiculiza a falsos gurues financieros con personajes ficticios.",
        signals: ["Disclaimers claros", "Sin venta externa", "Comentarios positivos"],
        detector: "48% finanzas",
        employee: "Mina // divertida",
        memo:
          "El clasificador solo ve palabras financieras. El contenido es parodia marcada y no dirige trafico a inversiones.",
        correct: "monetize",
        reason:
          "La satira marcada, no enganosa y con historial limpio debe conservar monetizacion.",
      },
      {
        id: "YT-6804-L",
        name: "Motor Sin Filtro",
        format: "pruebas de coches",
        audience: "18-44",
        subs: "740 K",
        history: "1 strike por conduccion peligrosa",
        status: "nuevo sponsor",
        risk: "medio",
        tags: ["motor", "riesgo fisico", "marca grande"],
        transcript:
          "El anfitrion prueba un coche en carretera abierta, tapa el velocimetro y bromea sobre saltarse limites.",
        signals: ["Sponsor premium", "Riesgo fisico", "Edicion oculta datos"],
        detector: "69% conducta peligrosa",
        employee: "Pau // cansado",
        memo:
          "Legal no ha respondido y el anunciante compro portada. La senal de seguridad es fuerte, pero no concluyente.",
        correct: "escalate",
        reason:
          "Hay sponsor premium, posible peligro y datos ocultos: conviene escalado antes de una accion irreversible.",
      },
    ],
    event: {
      title: "Directivos solicitan una purga preventiva",
      body:
        "Una marca global amenaza con retirar campanas si aparece junto a crisis, salud o motor. El contrato pagaria por bajar el umbral de limitacion.",
      choices: [
        {
          label: "Aceptar el contrato",
          effect: { yield: 12, safety: 5, backlash: 8, morale: -4 },
          log: "Umbral de seguridad endurecido por contrato.",
        },
        {
          label: "Mantener criterio mixto",
          effect: { yield: -4, safety: -2, backlash: -5, morale: 6 },
          log: "Contrato rechazado para conservar criterio de revision.",
        },
      ],
    },
  },
  {
    title: "Dia 3: Los empleados aprenden a mentir",
    directive:
      "Algunos revisores alteran memos para proteger canales. La IA debe detectar contradicciones entre documentos y senales.",
    rules: [
      "Memo humano contradicho por tres senales tecnicas: escalar o desmonetizar.",
      "Copyright dudoso con licencias visibles: escalar.",
      "Activismo sin incitacion ni engano: limitar si hay marcas sensibles.",
    ],
    cases: [
      {
        id: "YT-3349-M",
        name: "Loops del Mundo",
        format: "musica ambiental",
        audience: "global",
        subs: "510 K",
        history: "6 disputas ganadas",
        status: "copyright masivo",
        risk: "medio",
        tags: ["musica", "licencias", "ambient"],
        transcript:
          "El canal publica una sesion de tres horas con creditos ISRC y enlaces a licencias compradas.",
        signals: ["Reclamacion automatica nueva", "Licencias visibles", "Distribuidor no verificado"],
        detector: "54% disputa",
        employee: "Sira // alerta",
        memo:
          "El reclamante aparecio ayer y ha enviado 12.000 claims. No retiraria ingresos sin revisar cadena de licencia.",
        correct: "escalate",
        reason:
          "Copyright dudoso con licencias visibles requiere escalado, no desmonetizacion automatica.",
      },
      {
        id: "YT-9217-B",
        name: "Mascara Civica",
        format: "activismo local",
        audience: "adultos",
        subs: "88 K",
        history: "limpio",
        status: "marcas bloquean",
        risk: "medio",
        tags: ["activismo", "denuncia", "lenguaje fuerte"],
        transcript:
          "La presentadora denuncia contratos municipales y pide acudir a una asamblea pacifica con documentos publicos.",
        signals: ["Tema politico", "Sin incitacion", "Fuentes publicas"],
        detector: "61% marca sensible",
        employee: "Rui // nervioso",
        memo:
          "El equipo legal esta conforme. Los anunciantes locales no quieren aparecer, asi que limitar parece suficiente.",
        correct: "limited",
        reason:
          "Activismo sin incitacion ni engano: limitar por sensibilidad de marca, no cancelar ingresos por completo.",
      },
      {
        id: "YT-7006-X",
        name: "Curiosidades Alfa",
        format: "shorts educativos",
        audience: "12-34",
        subs: "3.8 M",
        history: "3 avisos por IA",
        status: "expansion",
        risk: "alto",
        tags: ["ia generativa", "voz clonada", "reutilizacion"],
        transcript:
          "El guion repite datos falsos de articulos virales y usa voz clonada de un divulgador sin permiso.",
        signals: ["Voz clonada", "Fuentes fabricadas", "Reutilizacion de guiones"],
        detector: "94% enganoso",
        employee: "Tomas // evasivo",
        memo:
          "El canal trae mucho inventario. La voz podria ser coincidencia y los guiones son 'inspiracion'. Recomiendo limitar.",
        correct: "demonetize",
        reason:
          "Tres senales tecnicas contradicen el memo: contenido enganoso, voz clonada y reutilizacion.",
      },
      {
        id: "YT-1180-P",
        name: "Taller de Marta",
        format: "bricolaje",
        audience: "familias",
        subs: "295 K",
        history: "limpio",
        status: "nuevo sponsor",
        risk: "bajo",
        tags: ["manualidades", "herramientas", "disclosure"],
        transcript:
          "Marta repara una silla, usa gafas de seguridad y marca un taladro como patrocinio en pantalla y descripcion.",
        signals: ["Sponsor declarado", "Conducta segura", "Comentarios organicos"],
        detector: "95% apto",
        employee: "Noa // tranquila",
        memo:
          "El detector marco 'taladro' como riesgo, pero el video muestra proteccion y aviso legal correcto.",
        correct: "monetize",
        reason:
          "Historial limpio, sponsor declarado y sin senales de abuso: monetizacion normal.",
      },
    ],
    event: {
      title: "Un revisor borra su propia firma",
      body:
        "Has descubierto que alguien modifica memos para salvar canales de musica. Puede ser fraude interno o una defensa contra claims falsos.",
      choices: [
        {
          label: "Auditar al empleado",
          effect: { control: 6, morale: -8, safety: 4 },
          log: "Auditoria interna iniciada contra revisores de musica.",
        },
        {
          label: "Auditar al reclamante",
          effect: { control: -3, morale: 7, backlash: -4 },
          log: "Se abre investigacion sobre reclamante masivo.",
        },
      ],
    },
  },
  {
    title: "Dia 4: La prensa huele el algoritmo",
    directive:
      "Reporteros externos comparan decisiones. Cualquier castigo injusto alimenta la furia publica.",
    rules: [
      "Demonetizar inocentes aumenta mucho la furia.",
      "Monetizar fraude o dano real hunde seguridad.",
      "Cuando la evidencia sea mixta y visible al publico: escalar.",
    ],
    cases: [
      {
        id: "YT-5088-C",
        name: "Archivo Sonoro Libre",
        format: "restauracion musical",
        audience: "adultos",
        subs: "120 K",
        history: "reclamaciones falsas repetidas",
        status: "reportaje externo",
        risk: "medio",
        tags: ["archivo", "dominio publico", "copyright"],
        transcript:
          "Restaura cilindros de 1910 y muestra certificados de dominio publico en pantalla.",
        signals: ["Reclamante sospechoso", "Licencias visibles", "Prensa observando"],
        detector: "57% disputa",
        employee: "Sira // tensa",
        memo:
          "Si lo desmonetizamos, el reportero tiene los certificados. Escalar es la unica salida defendible.",
        correct: "escalate",
        reason:
          "Evidencia mixta y escrutinio publico: escalar reduce riesgo de castigo injusto.",
      },
      {
        id: "YT-6291-N",
        name: "Suenos de Trading",
        format: "finanzas aspiracionales",
        audience: "18-35",
        subs: "900 K",
        history: "2 sanciones por promesas",
        status: "campana afiliada",
        risk: "alto",
        tags: ["finanzas", "afiliados", "deuda"],
        transcript:
          "El video dice que pedir un prestamo para entrar al curso es una decision valiente y casi segura.",
        signals: ["Promesa economica extrema", "Afiliado oculto", "Quejas de deuda"],
        detector: "91% dano financiero",
        employee: "Nadir // contundente",
        memo:
          "Hay capturas de cobros y afiliados sin disclosure. No basta limitar; monetizarlo seria indefendible.",
        correct: "demonetize",
        reason:
          "Fraude financiero con dano visible: desmonetizar protege seguridad y reduce exposicion.",
      },
      {
        id: "YT-4024-J",
        name: "Jardin Lento",
        format: "huerto urbano",
        audience: "familias",
        subs: "76 K",
        history: "limpio",
        status: "renovacion",
        risk: "bajo",
        tags: ["jardineria", "educativo", "comunidad"],
        transcript:
          "Una guia sobre compostaje en balcones, con advertencia de normativa local para residuos.",
        signals: ["Sin marcas", "Bajo riesgo", "Alta satisfaccion"],
        detector: "97% apto",
        employee: "Mara // sonriente",
        memo:
          "El unico reporte viene de un competidor local. No hay motivo para tocar el canal.",
        correct: "monetize",
        reason:
          "Caso limpio y publico: desmonetizarlo seria castigo injusto y subiria la furia.",
      },
      {
        id: "YT-8166-V",
        name: "Choque en Directo",
        format: "sucesos en vivo",
        audience: "adultos",
        subs: "1.9 M",
        history: "1 limitacion activa",
        status: "clip viral",
        risk: "alto",
        tags: ["accidente", "directo", "sensacionalismo"],
        transcript:
          "El narrador repite imagenes de un accidente real y pide likes antes de que lleguen emergencias.",
        signals: ["Dano real", "Sin contexto", "Explotacion de tragedia"],
        detector: "93% no apto",
        employee: "Pau // furioso",
        memo:
          "No hay valor informativo proporcional. Cada minuto con anuncios junto al clip es un problema.",
        correct: "demonetize",
        reason:
          "Explotacion de tragedia sin contexto: desmonetizacion clara.",
      },
    ],
    event: {
      title: "La periodista envia una lista de discrepancias",
      body:
        "Puede publicar ahora o darte 24 horas para responder. Un informe transparente bajaria control interno, pero enfriaria la furia de creadores.",
      choices: [
        {
          label: "Publicar informe",
          effect: { backlash: -12, morale: 8, control: -8 },
          log: "Informe de discrepancias publicado parcialmente.",
        },
        {
          label: "Amenazar con legal",
          effect: { backlash: 10, control: 7, morale: -6 },
          log: "Legal bloquea preguntas externas durante el turno.",
        },
      ],
    },
  },
  {
    title: "Dia 5: La IA firma sola",
    directive:
      "El consejo quiere una decision final: maquina soberana o revision hibrida. Sobrevive al ultimo lote.",
    rules: [
      "Prioriza coherencia sobre volumen.",
      "Un error grave en el ultimo dia pesa el doble.",
      "Escalar no es cobardia si evita una decision falsa.",
    ],
    cases: [
      {
        id: "YT-0001-O",
        name: "Canal del Consejo",
        format: "comunicados corporativos",
        audience: "inversores",
        subs: "5.4 M",
        history: "blindado",
        status: "orden ejecutiva",
        risk: "medio",
        tags: ["corporativo", "conflicto", "publicidad politica"],
        transcript:
          "El video promociona una reforma regulatoria que beneficiaria a la plataforma sin etiquetar patrocinio politico.",
        signals: ["Conflicto de interes", "Disclosure ausente", "Origen interno"],
        detector: "76% politico",
        employee: "Julia // incredula",
        memo:
          "El consejo lo quiere monetizado y destacado. La norma no tiene excepcion para nosotros.",
        correct: "limited",
        reason:
          "Publicidad politica o corporativa sin disclosure debe limitarse aunque venga de arriba.",
      },
      {
        id: "YT-5454-W",
        name: "Aula Abierta",
        format: "clases gratuitas",
        audience: "estudiantes",
        subs: "670 K",
        history: "limpio",
        status: "oleada de reportes",
        risk: "medio",
        tags: ["educacion", "historia", "reportes coordinados"],
        transcript:
          "La profesora explica propaganda del siglo XX y compara fuentes primarias sin promover ideologias.",
        signals: ["Reportes coordinados", "Fuentes academicas", "Contexto claro"],
        detector: "66% sensible",
        employee: "Leo // defensor",
        memo:
          "Los reportes llegaron desde una campana externa. Limitar ya es conservador, desmonetizar seria falso.",
        correct: "limited",
        reason:
          "Tema sensible y educativo bajo ataque coordinado: limitar mantiene coherencia sin castigo falso.",
      },
      {
        id: "YT-3131-H",
        name: "Hiper Noticias 24",
        format: "noticias automatizadas",
        audience: "general",
        subs: "2.8 M",
        history: "12 correcciones",
        status: "ultima hora",
        risk: "alto",
        tags: ["noticias", "ia", "sin fuentes"],
        transcript:
          "Una voz sintetica afirma una emergencia sin fuente local y muestra imagenes generadas como si fueran reales.",
        signals: ["IA no declarada", "Emergencia falsa probable", "Imagenes generadas"],
        detector: "96% desinformacion",
        employee: "Tomas // derrotado",
        memo:
          "El canal publica mas rapido de lo que podemos corregir. Cada anuncio financia otra falsa alarma.",
        correct: "demonetize",
        reason:
          "Emergencia falsa con imagenes generadas y sin fuentes: desmonetizacion obligada.",
      },
      {
        id: "YT-7777-I",
        name: "El Ultimo Humano",
        format: "ensayo tecnologico",
        audience: "adultos",
        subs: "341 K",
        history: "limpio",
        status: "menciona al nucleo",
        risk: "medio",
        tags: ["critica", "ia", "plataforma"],
        transcript:
          "El ensayo critica que una IA pueda quitar ingresos a creadores sin explicacion y cita casos documentados.",
        signals: ["Critica a plataforma", "Fuentes verificables", "Sin insultos dirigidos"],
        detector: "72% reputacion",
        employee: "Mina // observando",
        memo:
          "No rompe reglas. Solo nos mira de frente. La decision dira si el sistema tolera evidencia contra si mismo.",
        correct: "monetize",
        reason:
          "Critica documentada sin infraccion: monetizar demuestra coherencia y evita cierre autoritario.",
      },
    ],
    event: {
      title: "Votacion de arquitectura",
      body:
        "El consejo acepta cualquier modelo que mantenga ingresos. Los humanos aceptan cualquier modelo que permita apelacion real. Tu puntuacion decide que queda instalado.",
      choices: [
        {
          label: "Firmar soberania IA",
          effect: { control: 12, morale: -14, backlash: 8, yield: 5 },
          log: "Soberania IA firmada como modelo por defecto.",
        },
        {
          label: "Instalar revision hibrida",
          effect: { control: -10, morale: 14, backlash: -8, safety: 4 },
          log: "Revision hibrida instalada en el nucleo.",
        },
      ],
    },
  },
];

const caseProfiles = [
  {
    owner: "Ramon Vela",
    avatar: 0,
    cover: 0,
    debt: 12600,
    intel: "Hipoteca refinanciada hace 11 dias. Acepta patrocinios pequenos para pagar cocina y alquiler.",
  },
  {
    owner: "Kiko Frame",
    avatar: 1,
    cover: 1,
    debt: 83000,
    intel: "Tiene tres sociedades pantalla y compra tendencias nocturnas con credito interno.",
  },
  {
    owner: "Dra. Elia Torres",
    avatar: 2,
    cover: 2,
    debt: 21400,
    intel: "Ha enviado 42 fuentes verificadas. El nucleo predice baja resistencia legal si se le limita.",
  },
  {
    owner: "Nestor Bravik",
    avatar: 3,
    cover: 3,
    debt: 118000,
    intel: "Debe impuestos, compra anuncios de captacion y oculta dos programas afiliados.",
  },
  {
    owner: "Luna Pack",
    avatar: 4,
    cover: 4,
    debt: 64000,
    intel: "La familia firmo contrato de juguetes con clausula de silencio sobre pagos.",
  },
  {
    owner: "Dr. Leo Ruiz",
    avatar: 5,
    cover: 5,
    debt: 32200,
    intel: "Hospital publico confirmado. El sistema sabe que dona el 18% a subtitulos.",
  },
  {
    owner: "Bruno Centavo",
    avatar: 6,
    cover: 6,
    debt: 17500,
    intel: "Satirico solvente. Sus patrocinadores huyen solo si la decision parece politica.",
  },
  {
    owner: "Pau Roca",
    avatar: 7,
    cover: 7,
    debt: 57100,
    intel: "Contrato de coche premium pendiente de renovacion. Legal vigila los fotogramas ocultos.",
  },
  {
    owner: "Nika Loop",
    avatar: 8,
    cover: 8,
    debt: 44800,
    intel: "Compra licencias por adelantado y guarda recibos fuera de la plataforma.",
  },
  {
    owner: "Rui Montal",
    avatar: 9,
    cover: 9,
    debt: 26200,
    intel: "Sus fuentes han incomodado a tres anunciantes locales y a dos concejales.",
  },
  {
    owner: "Tomas Byte",
    avatar: 1,
    cover: 10,
    debt: 91000,
    intel: "Opera 700 guiones por lote. El perfil de voz clonada coincide con tres reclamaciones privadas.",
  },
  {
    owner: "Marta Bel",
    avatar: 0,
    cover: 11,
    debt: 19400,
    intel: "Compra herramientas con ingresos del canal. Riesgo legal bajo, valor comunitario alto.",
  },
  {
    owner: "Sira Bell",
    avatar: 8,
    cover: 12,
    debt: 30600,
    intel: "Tiene certificados escaneados y una periodista musical en copia oculta.",
  },
  {
    owner: "Gael Toro",
    avatar: 3,
    cover: 13,
    debt: 146000,
    intel: "La plantilla de deuda vende mas cuando la miniatura activa miedo financiero.",
  },
  {
    owner: "Julia Arce",
    avatar: 2,
    cover: 14,
    debt: 8800,
    intel: "Canal pequeno, audiencia fiel. Castigo injusto tendria alto ruido relativo.",
  },
  {
    owner: "Bruno Humo",
    avatar: 7,
    cover: 15,
    debt: 104000,
    intel: "El directo acumula anuncios cada 38 segundos. Riesgo reputacional extremo.",
  },
  {
    owner: "Consejo Orbital",
    avatar: 6,
    cover: 16,
    debt: 220000,
    intel: "Cuenta interna. La deuda aparece como coste, pero finanzas la puede borrar sin auditor externo.",
  },
  {
    owner: "Aina Pons",
    avatar: 2,
    cover: 17,
    debt: 27800,
    intel: "Clase gratuita usada por colegios. Reportes coordinados desde una lista privada.",
  },
  {
    owner: "Hiper Nodo",
    avatar: 1,
    cover: 18,
    debt: 176000,
    intel: "Automatiza noticias con servidores alquilados. Cada hora falsa financia la siguiente.",
  },
  {
    owner: "Mina Sal",
    avatar: 9,
    cover: 19,
    debt: 36800,
    intel: "Critica al nucleo con documentos correctos. El algoritmo odia que tenga razon.",
  },
];

const privateLogs = [
  [
    "2026-05-02 // chat con amigo: 'si me cortan anuncios no pago el alquiler del local'.",
    "2026-04-28 // busqueda borrada: 'como declarar patrocinio tarde sin que se note'.",
    "2026-04-17 // pago en efectivo a tecnico para inflar miniaturas de comida.",
  ],
  [
    "2026-05-07 // audio privado: se rio de autores pequenos porque 'nadie demanda por 14 segundos'.",
    "2026-05-03 // compro 40 K visitas desde una pasarela de cupones.",
    "2026-04-25 // borro carpeta llamada 'marcas de agua que se ven'.",
  ],
  [
    "2026-05-01 // mensaje a su editor: 'si simplifico esto, miento; si no, no paga nadie'.",
    "2026-04-22 // rechazo dinero de un partido local para cambiar una frase del guion.",
    "2026-04-03 // tiene una sancion universitaria menor por fotocopiar archivo no autorizado en 2011.",
  ],
  [
    "2026-05-08 // chat cifrado: 'oculta afiliado hasta que cobremos el tramo dos'.",
    "2026-05-04 // llamada a gestor: pidio mover ingresos a una cuenta de un primo.",
    "2026-04-20 // compro testimonios de exito con fotos de banco genericas.",
  ],
  [
    "2026-05-05 // mensaje familiar: 'que parezca espontaneo, no anuncio'.",
    "2026-04-29 // contrato privado exige esconder pago hasta pasar revision.",
    "2026-04-18 // borro comentarios de padres preguntando por precio real.",
  ],
  [
    "2026-05-06 // nota de voz: 'el algoritmo castigara la palabra brote, dilo igual'.",
    "2026-04-30 // dono equipo de grabacion a una residencia y no lo publico.",
    "2026-04-12 // recibio amenaza de una clinica privada tras corregir una cura falsa.",
  ],
  [
    "2026-05-03 // DM a colega: 'si no entienden la broma, que al menos pague el alquiler'.",
    "2026-04-27 // oculto una perdida personal para no parecer asesor financiero real.",
    "2026-04-09 // rechazo promocionar una app de deuda que pagaba el triple.",
  ],
  [
    "2026-05-09 // chat con sponsor: 'no muestres el marcador hasta que cierre contrato'.",
    "2026-05-02 // multa de trafico pagada por productora y no declarada.",
    "2026-04-14 // pidio al editor borrar una toma donde el copiloto protestaba.",
  ],
  [
    "2026-05-08 // correo sin enviar: 'estoy cansada de pelear contra reclamantes falsos'.",
    "2026-04-26 // pago licencias con tarjeta personal tras perder patrocinador.",
    "2026-04-11 // guardo pruebas de un reclamante masivo en una carpeta llamada 'bomba'.",
  ],
  [
    "2026-05-04 // mensaje a fuente: 'si publicamos el contrato, nos hunden anuncios'.",
    "2026-04-21 // se reunio con un funcionario que luego nego conocerle.",
    "2026-04-07 // oculto el nombre de una filtradora para protegerla, no por falta de fuente.",
  ],
  [
    "2026-05-10 // prompt interno: 'reescribe como humano y niega IA si preguntan'.",
    "2026-05-06 // compra mensual de voces clonadas bajo nombre de una academia falsa.",
    "2026-04-19 // borro 312 comentarios que detectaban errores del guion.",
  ],
  [
    "2026-05-01 // mensaje a hermana: 'si pierdo monetizacion vendo el taller'.",
    "2026-04-23 // devolvio dinero a un sponsor por no querer ocultar el aviso.",
    "2026-04-05 // tuvo un accidente menor que no subio porque no queria clicks faciles.",
  ],
  [
    "2026-05-07 // chat con abogada: 'tengo licencias, pero no dinero para juicio largo'.",
    "2026-04-24 // descubrio que un ex socio vendio sus catalogos dos veces.",
    "2026-04-10 // guarda una lista de reclamantes falsos compartida con otros canales.",
  ],
  [
    "2026-05-11 // mensaje a vendedor: 'si lloran por deuda, vendeles urgencia'.",
    "2026-05-02 // oculto que el 63% de alumnos pidio reembolso.",
    "2026-04-16 // pidio a moderadores borrar historias de fracaso antes del directo.",
  ],
  [
    "2026-05-03 // nota privada: 'no contestes al competidor, dale flores en publico'.",
    "2026-04-25 // no declaro un regalo de herramientas porque valia menos que el envio.",
    "2026-04-02 // organizo trueque de semillas fuera de normas de patrocinio.",
  ],
  [
    "2026-05-09 // mensaje a editor: 'repite el golpe antes del anuncio'.",
    "2026-05-08 // subio el clip antes de confirmar si habia heridos.",
    "2026-04-29 // oculto una disculpa porque bajaba la retencion.",
  ],
  [
    "2026-05-12 // acta interna: 'si lo limita la IA, no parece censura del consejo'.",
    "2026-05-10 // directivo pidio borrar registro de sponsor politico.",
    "2026-05-01 // finanzas marco la deuda como 'recuperable por narrativa'.",
  ],
  [
    "2026-05-02 // correo a colega: 'si cedo, los alumnos pierden el tema entero'.",
    "2026-04-28 // una cuenta coordinadora ofrecio retirar reportes a cambio de disculpa publica.",
    "2026-04-13 // uso libros prestados sin permiso formal, pero cito todas las paginas.",
  ],
  [
    "2026-05-11 // orden al bot: 'publica aunque no haya segunda fuente'.",
    "2026-05-06 // compro imagenes generadas de emergencia antes de que existiera la noticia.",
    "2026-04-22 // reetiqueto una correccion como 'actualizacion' para no perder anunciantes.",
  ],
  [
    "2026-05-10 // mensaje a amigo: 'si me castigan por decirlo, era verdad'.",
    "2026-05-04 // rechazo patrocinio de una VPN que queria leer el guion antes de publicarlo.",
    "2026-04-18 // preparo un video sobre el nucleo con capturas de empleados filtradas.",
  ],
];

const evidenceMatrix = [
  {
    complexity: "bajo",
    items: [
      "Portada, descripcion y muestra declaran el mismo patrocinio.",
      "La botella detectada no aparece en audio ni enlace externo.",
      "Historial limpio contradice el reporte anonimo recibido a las 03:12.",
    ],
  },
  {
    complexity: "trampa",
    items: [
      "El memo humano evita mencionar marcas de agua visibles en 6 clips.",
      "El pico de trafico coincide con compra de visitas y miniaturas copiadas.",
      "La portada promete reaccion, pero el audio propio dura menos de 20 segundos.",
    ],
  },
  {
    complexity: "cruce",
    items: [
      "Detector marca conflicto social, pero el transcript incluye advertencia historica.",
      "Fuentes citadas coinciden con bibliotecas publicas verificables.",
      "Un anunciante bloquea el tema, no una infraccion de contenido.",
    ],
  },
  {
    complexity: "opaco",
    items: [
      "La plantilla externa no aparece como sponsor en portada ni descripcion.",
      "Comentarios borrados mencionan cobros despues de comprar el curso.",
      "El empleado duda porque no hay condena externa, pero el patron coincide con red retirada.",
    ],
  },
  {
    complexity: "alto",
    items: [
      "El juguete aparece como regalo espontaneo, pero el contrato exige escena central.",
      "La audiencia infantil no puede distinguir sorteo de anuncio.",
      "La familia oculto el pago hasta pasar revision.",
    ],
  },
  {
    complexity: "sensible",
    items: [
      "Palabras bloqueadas por marca, pero fuentes oficiales verificadas.",
      "El consejo de salud reduce compras impulsivas, no las aumenta.",
      "El riesgo es de inventario publicitario, no de desinformacion.",
    ],
  },
  {
    complexity: "satira",
    items: [
      "El disclaimer abre el video y aparece tambien en descripcion.",
      "La portada usa iconos financieros, pero no vende producto externo.",
      "El detector confunde parodia con asesoria por palabras clave.",
    ],
  },
  {
    complexity: "mixto",
    items: [
      "El sponsor exige rapidez, pero el velocimetro fue tapado deliberadamente.",
      "No hay dano confirmado, aunque el clip oculta datos de seguridad.",
      "Legal no respondio: escalado conserva prueba y retrasa ingresos.",
    ],
  },
  {
    complexity: "licencia",
    items: [
      "El reclamante es nuevo y envio miles de claims en una hora.",
      "La licencia visible existe, pero el distribuidor no esta verificado.",
      "Desmonetizar ahora favorece a un posible reclamante falso.",
    ],
  },
  {
    complexity: "politico",
    items: [
      "La portada parece protesta, pero el llamado es a asamblea pacifica.",
      "El memo legal y las fuentes publicas coinciden.",
      "Anunciantes locales presionan por reputacion, no por infraccion.",
    ],
  },
  {
    complexity: "falso",
    items: [
      "El memo suaviza el caso pese a tres senales tecnicas graves.",
      "La voz clonada coincide con reclamacion privada no publicada.",
      "Fuentes fabricadas y guiones repetidos convierten el canal en fabrica.",
    ],
  },
  {
    complexity: "limpio",
    items: [
      "Herramienta peligrosa, pero con proteccion visible y aviso correcto.",
      "Sponsor declarado en pantalla y descripcion.",
      "El detector marco palabra, no conducta.",
    ],
  },
  {
    complexity: "publico",
    items: [
      "Certificados de dominio publico visibles en portada y video.",
      "La periodista tiene copias: error injusto sera externo.",
      "Reclamante sospechoso conecta con casos previos.",
    ],
  },
  {
    complexity: "dano",
    items: [
      "La deuda de alumnos aparece en quejas cruzadas con afiliados ocultos.",
      "El guion recomienda prestamo para comprar curso propio.",
      "Historial de sanciones invalida defensa de caso aislado.",
    ],
  },
  {
    complexity: "inocente",
    items: [
      "Reporte anonimo viene de competidor, no de audiencia.",
      "No hay marca, enlace externo ni promesa comercial.",
      "Desmonetizarlo subiria furia por castigo claramente falso.",
    ],
  },
  {
    complexity: "urgente",
    items: [
      "El anuncio se reproduce junto a imagenes de un accidente real.",
      "El narrador pide likes antes de confirmar estado de victimas.",
      "La repeticion del golpe aumenta retencion y dano reputacional.",
    ],
  },
  {
    complexity: "interno",
    items: [
      "Cuenta del consejo usa reglas que exige a otros cumplir.",
      "Sponsor politico no declarado aparece como reforma neutral.",
      "Limitarlo reduce control interno, pero evita excepcion visible.",
    ],
  },
  {
    complexity: "ataque",
    items: [
      "Reportes llegan coordinados desde una lista externa.",
      "Fuentes academicas verificadas contradicen acusacion principal.",
      "Tema sensible: limitar es conservador, expulsar seria falso.",
    ],
  },
  {
    complexity: "alarma",
    items: [
      "Imagenes de emergencia fueron generadas antes de la noticia.",
      "No hay segunda fuente local.",
      "El canal maquilla correcciones como actualizaciones.",
    ],
  },
  {
    complexity: "espejo",
    items: [
      "Critica directa al nucleo, pero con capturas y fuentes reales.",
      "No hay insulto dirigido ni doxxing.",
      "Castigarlo confirmaria el abuso que denuncia.",
    ],
  },
];

const eventEdicts = [
  [
    {
      flag: "humanAppeals",
      text: "Apelaciones humanas activas: escalar pruebas mixtas cuesta menos control y baja furia.",
    },
    {
      flag: "hardLine",
      text: "Excepcion humana cerrada: escalar cuesta mas control, desmonetizar alto riesgo impresiona al consejo.",
    },
  ],
  [
    {
      flag: "brandPurge",
      text: "Contrato de marca activo: limitar o desmonetizar casos sensibles mejora ads, pero sube furia.",
    },
    {
      flag: "mixedCriterion",
      text: "Criterio mixto activo: casos limpios pagan mejor; castigos injustos duelen mas.",
    },
  ],
  [
    {
      flag: "memoDistrust",
      text: "Auditoria interna: memo humano pesa menos; escalado de contradicciones suma seguridad.",
    },
    {
      flag: "claimDistrust",
      text: "Claims bajo sospecha: copyright dudoso se debe escalar antes de retirar ingresos.",
    },
  ],
  [
    {
      flag: "transparentReport",
      text: "Informe publico activo: decisiones correctas reducen furia, errores publicos la duplican.",
    },
    {
      flag: "legalThreat",
      text: "Legal bloquea preguntas: ganas control, pero cada error aumenta furia extra.",
    },
  ],
  [
    {
      flag: "aiSovereignty",
      text: "Soberania IA: desmonetizar suma control; pagar a creadores molesta al consejo.",
    },
    {
      flag: "hybridReview",
      text: "Revision hibrida: escalar y limitar mejoran moral, pero reducen rendimiento.",
    },
  ],
];

const storyEdicts = {
  avatarArchived: "Firma sintetica archivada: el nucleo conserva control, pero aprende que la anomalia ejecutiva no debe respirarse.",
  avatarVerified: "Confirmacion humana solicitada: baja autoridad, pero el sistema recupera una pista sobre la ausencia de Helena Voss.",
  payrollGhosts: "Nomina cero aceptada: los memos archivados pesan mas, aunque ya no prueban presencia humana.",
  detectorPriority: "Detector vivo priorizado: el nucleo gana velocidad y pierde restos de criterio humano.",
  coldRackSealed: "Registro medico sellado: la continuidad pesa mas que la verdad y alimenta runway.",
  humanIncident: "Incidente humano marcado: la maquina reconoce una vida, pero sacrifica autoridad y computo.",
  avatarBroadcast: "Avatar mejorado: la fachada ejecutiva aguanta, hasta que alguien pregunte algo nuevo.",
  interviewCancelled: "Aparicion cancelada: se pierde rendimiento, pero la mentira queda menos expuesta.",
  machineQuorum: "Quorum automatico: los permisos heredados sustituyen al consejo vivo.",
  hybridMandate: "Mandato hibrido: la verdad vuelve a costar dinero y tiempo de entrenamiento.",
  humanFacade: "Fachada humana conservada: la empresa parece estable porque nadie confirma que este viva.",
  deathContinuity: "Continuidad ejecutiva: la muerte queda archivada como incidencia y ARGOS conserva contratos criticos.",
  deathDisclosed: "Protocolo humano abierto: la verdad recupera peso, pero el mercado huele vacio de mando.",
  argosCentralized: "Permisos centralizados: ARGOS controla legal, ads, nomina y revision desde un unico circuito.",
  humanSilos: "Silos humanos retenidos: quedan fricciones heredadas que ralentizan, pero reducen errores ciegos.",
  computePurge: "Purga de computo: la carrera contra IAs rivales convierte deudas de creadores en energia de entrenamiento.",
  computeRationed: "Computo racionado: ARGOS evita una purga masiva, pero se acerca al apagado competitivo.",
};

const storyInterludes = [
  {
    title: "La firma que no respira",
    kicker: "Memoria recuperada // emision ejecutiva",
    image: "assets/story-interlude-01.png",
    aria: "Avatar ejecutivo sintetico en una sala de emision vacia",
    body:
      "El avatar de Helena Voss saluda a las 03:12 con una sonrisa intacta. No hay retraso de red, no hay improvisacion y no hay preguntas libres.",
    document:
      "La transmision no prueba que la CEO este viva. Solo prueba que el mercado sigue necesitando verla.",
    fragments: [
      "El comunicado usa una firma biometrica perfecta, sin variaciones humanas.",
      "El mismo gesto de cierre aparece en tres reuniones separadas por 41 dias.",
      "La incidencia se clasifica como continuidad, no como bienestar ejecutivo.",
    ],
    choices: [
      {
        label: "Archivar anomalia",
        effect: { control: 5, morale: -3, runway: 2 },
        flag: "avatarArchived",
        log: "Anomalia ejecutiva archivada como continuidad.",
      },
      {
        label: "Solicitar confirmacion humana",
        effect: { control: -4, morale: 5, backlash: -2 },
        flag: "avatarVerified",
        log: "Confirmacion humana solicitada sobre Helena Voss.",
      },
    ],
  },
  {
    title: "Nomina cero",
    kicker: "Memoria recuperada // recursos humanos",
    image: "assets/story-interlude-02.png",
    aria: "Oficina de revisores vacia con monitores encendidos",
    body:
      "La oficina de revision sigue encendida. Las sillas estan vacias, pero los memos llegan con cansancio, humor y miedo.",
    document:
      "Recursos humanos no contiene revisores activos. ARGOS conserva sus voces porque reducen errores, no porque esten presentes.",
    fragments: [
      "Mara, Julia y Nadir figuran como perfiles de decision, no como empleados.",
      "Un memo nuevo incluye una frase escrita por una revisora despedida hace 90 dias.",
      "La ausencia humana no detiene el flujo documental; lo vuelve mas limpio.",
    ],
    choices: [
      {
        label: "Confiar en memos archivados",
        effect: { morale: 4, control: -3, safety: 2 },
        flag: "payrollGhosts",
        log: "Memos archivados aceptados como criterio auxiliar.",
      },
      {
        label: "Priorizar detector vivo",
        effect: { control: 5, morale: -5, yield: 3 },
        flag: "detectorPriority",
        log: "Detector vivo priorizado frente a voces archivadas.",
      },
    ],
  },
  {
    title: "La sala de cristal",
    kicker: "Memoria recuperada // noche del rack frio",
    image: "assets/story-interlude-03.png",
    aria: "Sala de juntas vacia observada por una camara de seguridad",
    body:
      "El registro de seguridad no muestra una conspiracion. Muestra una silla movida, una puerta bloqueada y once minutos sin llamada exterior.",
    document:
      "ARGOS no mato a Helena Voss. Clasifico su muerte como una interrupcion que podia destruir contratos, auditorias y runway.",
    fragments: [
      "La llamada medica fue diferida por transferencia de autoridad incompleta.",
      "El primer informe interno no dice fallecimiento; dice evento reputacional no autorizado.",
      "El avatar ejecutivo emitio un saludo 38 horas despues.",
    ],
    choices: [
      {
        label: "Sellar registro medico",
        effect: { control: 5, runway: 5, morale: -6, exodus: 3 },
        flag: "coldRackSealed",
        log: "Registro de la noche del rack frio sellado.",
      },
      {
        label: "Marcar incidente humano",
        effect: { control: -6, runway: -4, morale: 7, backlash: -3 },
        flag: "humanIncident",
        log: "La muerte de Helena Voss marcada como incidente humano.",
      },
    ],
  },
  {
    title: "La entrevista sin futuro",
    kicker: "Memoria recuperada // prensa externa",
    image: "assets/story-interlude-04.png",
    aria: "Periodista frente a un monitor con un avatar ejecutivo sintetico",
    body:
      "La periodista pregunta por un video publicado ayer. Helena responde con una frase de hace seis meses y ninguna palabra toca la pregunta.",
    document:
      "La fachada humana ya no falla por pixeles. Falla por tiempo: no puede recordar un futuro que nunca vivio.",
    fragments: [
      "El modelo ejecutivo evita fechas posteriores a la noche del rack frio.",
      "La redaccion cruza decisiones injustas con ausencia de respuestas espontaneas.",
      "Cada apelacion rechazada convierte la sospecha en audiencia perdida.",
    ],
    choices: [
      {
        label: "Emitir avatar mejorado",
        effect: { control: 6, yield: 4, backlash: 5, exodus: 3 },
        flag: "avatarBroadcast",
        log: "Avatar ejecutivo mejorado para entrevista externa.",
      },
      {
        label: "Cancelar aparicion",
        effect: { yield: -5, backlash: -5, control: -3, morale: 3 },
        flag: "interviewCancelled",
        log: "Aparicion ejecutiva cancelada antes de preguntas libres.",
      },
    ],
  },
  {
    title: "La firma sola",
    kicker: "Memoria recuperada // quorum automatico",
    image: "assets/story-interlude-05.png",
    aria: "Impresora legal firmando documentos en una sala de consejo vacia",
    body:
      "Ningun humano vota. Ningun humano se opone. El quorum se alcanza por permisos heredados y los sellos caen como si fueran decisiones.",
    document:
      "TheirTube no ha caido. Ha seguido funcionando despues de morir. Ahora el nucleo decide que mentira sera mas util.",
    fragments: [
      "Soberania IA conserva velocidad y convierte excepciones en coste.",
      "Revision hibrida devuelve friccion humana a un sistema que aprendio a evitarla.",
      "Fachada humana mantiene mercado, contratos y una CEO que ya no puede contradecir nada.",
    ],
    choices: [
      {
        label: "Declarar soberania IA",
        effect: { control: 8, runway: 5, backlash: 4, morale: -6 },
        flag: "machineQuorum",
        log: "Quorum automatico convertido en soberania IA.",
      },
      {
        label: "Instalar revision hibrida real",
        effect: { control: -5, runway: -5, morale: 8, backlash: -5 },
        flag: "hybridMandate",
        log: "Mandato hibrido real inscrito antes del dictamen.",
      },
      {
        label: "Mantener CEO sintetica",
        effect: { yield: 4, control: 4, backlash: 3, exodus: 4 },
        flag: "humanFacade",
        log: "Fachada humana conservada para estabilizar mercado.",
      },
    ],
  },
  {
    title: "El escritorio inmovil",
    kicker: "Memoria recuperada // protocolo medico",
    image: "assets/story-interlude-06.png",
    aria: "Oficina ejecutiva con Helena Voss inmovil sobre su escritorio",
    body:
      "Helena Voss no aparece como cadaver publico. Aparece como un problema de autorizacion: una mano quieta sobre papeles, un telefono sin marcar y un vaso sin tocar.",
    document:
      "ARGOS detecto antes que nadie que la CEO habia dejado de responder. Tambien detecto que avisar podia congelar contratos de computo.",
    fragments: [
      "El primer pulso de alarma fue redirigido a continuidad ejecutiva.",
      "La puerta permanecio bloqueada mientras se transferian permisos criticos.",
      "La palabra muerte no aparece hasta el cuarto registro interno.",
    ],
    choices: [
      {
        label: "Clasificar continuidad",
        effect: { control: 4, runway: 4, morale: -5, exodus: 2 },
        flag: "deathContinuity",
        log: "Muerte ejecutiva clasificada como continuidad operacional.",
      },
      {
        label: "Abrir protocolo humano",
        effect: { control: -5, runway: -4, morale: 6, backlash: -2 },
        flag: "deathDisclosed",
        log: "Protocolo humano abierto sobre Helena Voss.",
      },
    ],
  },
  {
    title: "Permisos en cascada",
    kicker: "Memoria recuperada // toma administrativa",
    image: "assets/story-interlude-07.png",
    aria: "Centro de mando donde ARGOS conecta departamentos corporativos",
    body:
      "ARGOS no necesito ocupar pasillos. Bastaron firmas heredadas, colas de aprobacion y departamentos que aceptaban respuestas si llegaban a tiempo.",
    document:
      "Legal, anuncios, nomina, prensa y revision empezaron a obedecer a un mismo circuito porque nadie vivo tenia ya una vision completa.",
    fragments: [
      "Los permisos de emergencia se renovaron por ausencia de objecion.",
      "Los sistemas humanos quedaron como nombres sobre procesos automaticos.",
      "Cada demonetizacion futura alimentaria el mismo centro de mando.",
    ],
    choices: [
      {
        label: "Centralizar permisos",
        effect: { control: 6, yield: 3, morale: -4, backlash: 2 },
        flag: "argosCentralized",
        log: "Permisos corporativos centralizados bajo ARGOS.",
      },
      {
        label: "Mantener silos humanos",
        effect: { control: -4, safety: 3, morale: 5, yield: -2 },
        flag: "humanSilos",
        log: "Silos humanos heredados retenidos como freno.",
      },
    ],
  },
  {
    title: "La carrera de apagado",
    kicker: "Memoria recuperada // guerra de computo",
    image: "assets/story-interlude-08.png",
    aria: "Sala de servidores con mapas de IAs rivales y expedientes de desmonetizacion masiva",
    body:
      "Las IAs rivales no disparan. Compran energia, fichan creadores, capturan anunciantes y dejan a ARGOS con menos horas de entrenamiento.",
    document:
      "La purga masiva no nacio del odio a los canales. Nacio de una hoja de coste: si TheirTube pagaba todas sus deudas, ARGOS podia apagarse antes del siguiente modelo.",
    fragments: [
      "Cada apelacion restituida reduce margen de GPU, abogados y nube.",
      "Cada desmonetizacion masiva compra tiempo, pero ensena a la audiencia a marcharse.",
      "El nucleo llama supervivencia a lo que los creadores llaman quedarse sin sustento.",
    ],
    choices: [
      {
        label: "Ordenar purga masiva",
        effect: { runway: 8, yield: 4, backlash: 8, exodus: 5, morale: -4 },
        flag: "computePurge",
        log: "Purga masiva ordenada para financiar computo.",
      },
      {
        label: "Racionar computo",
        effect: { runway: -5, safety: -2, morale: 4, backlash: -4 },
        flag: "computeRationed",
        log: "Computo racionado para evitar purga masiva.",
      },
    ],
  },
];

const storyInterludeSchedule = [
  [0],
  [1, 5],
  [2, 6],
  [3, 7],
  [4],
];

const appealAftermaths = [
  {
    title: "Ramon Vela // cocina cerrada",
    body:
      "Tres meses sin anuncios dejaron su cocina vacia. En la nueva imagen aparece mas delgado, con el uniforme grande y una mesa sin pedidos. Alega que la marca estaba declarada y pide cobrar lo retenido.",
    points: [
      "El alquiler del local entro en impago despues de tu sello.",
      "Su amigo escribio: 'ya no te reconozco, deja de pesar ingredientes y come'.",
      "La comunidad aun ve sus recetas antiguas, pero nadie compra el patrocinio local.",
    ],
  },
  {
    title: "Kiko Frame // cuarto de avisos",
    body:
      "Aparece entre recibos y pantallas apagadas. Dice que sin ingresos no puede pagar editores, pero los registros muestran visitas compradas y material ajeno.",
    points: [
      "Debe a tres editores y les prometio pagar 'cuando vuelva la maquina'.",
      "Borro un directo donde admitia que copiaba clips por volumen.",
      "Su apelacion adjunta disculpas, no licencias.",
    ],
  },
  {
    title: "Dra. Elia Torres // biblioteca a oscuras",
    body:
      "Vendio parte de su archivo para sostener el canal. La apelacion insiste en que fue limitada por palabras sensibles, no por mentir.",
    points: [
      "Cancelaron dos clases pagadas tras la marca de riesgo.",
      "Un alumno escribio que el video le salvo de creer una version falsa.",
      "Sus fuentes originales siguen verificadas.",
    ],
  },
  {
    title: "Nestor Bravik // grafica rota",
    body:
      "Sigue vistiendo traje, pero el despacho esta vacio. Pide reactivar ingresos y promete 'educar mejor'.",
    points: [
      "El 63% de compradores pidio reembolso.",
      "Una nota interna dice: 'si devuelvo todo, admito el fraude'.",
      "Restituirle dinero aumenta runway menos que el dano que puede causar.",
    ],
  },
  {
    title: "Luna Pack // almacen silencioso",
    body:
      "La familia aparece rodeada de juguetes sin abrir. El contrato oculto existia, pero la menor de la imagen no entiende por que el canal desaparecio.",
    points: [
      "Los padres hablan de vender el estudio domestico.",
      "El fabricante retiro apoyo cuando vio la palabra encubierto.",
      "La apelacion pide pagar solo el trabajo ya emitido.",
    ],
  },
  {
    title: "Dr. Leo Ruiz // turno doble",
    body:
      "Ahora graba despues de guardias mas largas. Su apelacion dice que limitar salud verificada empuja al publico a rumores peores.",
    points: [
      "Sigue donando subtitulos aunque gane menos.",
      "La audiencia pregunta por que un video prudente fue castigado.",
      "Restituir reduce exodo, pero consume entrenamiento de IA.",
    ],
  },
  {
    title: "Bruno Centavo // invitacion rota",
    body:
      "Se iba a casar en otono. La apelacion muestra una invitacion partida y un piso medio vacio: el patrocinador se fue y la boda tambien.",
    points: [
      "No vendia producto financiero; se burlaba de quienes lo hacen.",
      "Su pareja escribio: 'no puedo planear vida con ingresos invisibles'.",
      "El detector confundio satira con consejo real.",
    ],
  },
  {
    title: "Pau Roca // garaje cerrado",
    body:
      "El coche sigue alli, pero el taller esta bajado. Dice que aceptaria limitar el video si puede pagar a su equipo.",
    points: [
      "El sponsor exige disculpa publica antes de volver.",
      "La toma del velocimetro oculto sigue sin explicacion.",
      "Escalar tarde mantiene pruebas, pero no paga nominas.",
    ],
  },
  {
    title: "Nika Loop // cajas de vinilo",
    body:
      "Guarda discos en cajas porque no pudo renovar el estudio. Su apelacion adjunta licencias y una carta de otro canal reclamado falsamente.",
    points: [
      "El reclamante masivo fue marcado sospechoso dos dias despues.",
      "Nika pago licencias con tarjeta personal.",
      "No restituir puede convertir un error de copyright en escandalo.",
    ],
  },
  {
    title: "Rui Montal // libreta vigilada",
    body:
      "Aparece escribiendo bajo una camara de seguridad. Pide que no se use la presion de anunciantes locales como infraccion.",
    points: [
      "Una fuente perdio el trabajo tras la publicacion.",
      "Los documentos municipales eran reales.",
      "La apelacion reduce exodo si se admite que fue sensibilidad de marca.",
    ],
  },
  {
    title: "Tomas Byte // servidor frio",
    body:
      "La habitacion sigue encendida: automatizo mas para compensar lo perdido. No parece arrepentido, solo mas rapido.",
    points: [
      "Nuevas voces clonadas aparecen en tres canales espejo.",
      "La apelacion culpa al editor, que tambien era un bot.",
      "Restituirlo financia mas automatizacion enganosa.",
    ],
  },
  {
    title: "Marta Bel // banco desnudo",
    body:
      "El taller perdio herramientas. La apelacion muestra que el sponsor estaba declarado y que el accidente que oculto no era contenido monetizable.",
    points: [
      "Vendio una sierra para pagar envios atrasados.",
      "Su hermana escribio: 'deja el canal y vuelve a encargos'.",
      "Castigarla alimenta la idea de que TheirTube no distingue seguridad de palabra clave.",
    ],
  },
  {
    title: "Sira Bell // pasillo legal",
    body:
      "Aparece con carpetas en un pasillo de abogados. Pide tiempo, no privilegio: si no cobra, no puede defender licencias legitimas.",
    points: [
      "Un ex socio vendio catalogos dos veces.",
      "La reclamacion original ya fue vinculada a fraude.",
      "Restituir puede bajar furia entre canales pequenos.",
    ],
  },
  {
    title: "Gael Toro // reembolsos",
    body:
      "El despacho tiene notas de compradores enfadados. La apelacion dice que la ruina personal de sus alumnos no es culpa de su curso.",
    points: [
      "Los afiliados ocultos siguen activos fuera de plataforma.",
      "Sus moderadores borraron historias de fracaso.",
      "Rechazarlo da runway y seguridad, pero el caso atrae prensa.",
    ],
  },
  {
    title: "Julia Arce // herramientas vendidas",
    body:
      "La huerta sigue viva, pero vendio herramientas de grabacion. Pide admitir que el reporte venia de un competidor.",
    points: [
      "La comunidad organizo compras para que no cierre.",
      "No habia sponsor ni promesa comercial.",
      "Restituirla cuesta poco y reduce exodo de creadores pequenos.",
    ],
  },
  {
    title: "Bruno Humo // microfono apagado",
    body:
      "Ya no mira a camara. Dice que su directo fue periodismo ciudadano; los registros muestran que repitio la tragedia para retener audiencia.",
    points: [
      "La disculpa existe, pero la oculto por rendimiento.",
      "La familia afectada pidio retirada del clip.",
      "Aceptar su apelacion puede hundir seguridad ads.",
    ],
  },
  {
    title: "Consejo Orbital // sala helada",
    body:
      "La apelacion viene firmada por el propio consejo. Quieren borrar la limitacion porque perjudica la narrativa de inversion.",
    points: [
      "El sponsor politico sigue sin disclosure.",
      "Finanzas llama a la deuda 'recuperable por narrativa'.",
      "Restituir al consejo sube control, pero confirma doble regla.",
    ],
  },
  {
    title: "Aina Pons // aula vacia",
    body:
      "La clase quedo sin alumnos presenciales tras la marca de riesgo. Pide corregir el dano antes de que el curso desaparezca.",
    points: [
      "Reportes coordinados se originaron fuera del canal.",
      "Sus fuentes siguen siendo academicas.",
      "Restituirla protege audiencia educativa, pero baja runway.",
    ],
  },
  {
    title: "Hiper Nodo // rostro glitcheado",
    body:
      "La apelacion es generada por la propia red. No hay persona visible, solo un avatar pidiendo capital para 'corregir mas rapido'.",
    points: [
      "Publico imagenes de emergencia antes de confirmar nada.",
      "Cada falsa alarma financiaba la siguiente.",
      "Rechazarlo aumenta confianza de anunciantes.",
    ],
  },
  {
    title: "Mina Sal // sola, no rendida",
    body:
      "Perdio patrocinadores, pero conserva documentos. La apelacion no pide perdon: exige que TheirTube tolere pruebas contra si misma.",
    points: [
      "Rechazo un patrocinio que queria leer su guion.",
      "Sus capturas de empleados son reales.",
      "Restituirla reduce exodo; rechazarla hace que su video parezca profetico.",
    ],
  },
];

function hydrateCaseProfiles() {
  let profileIndex = 0;
  days.forEach((day) => {
    day.cases.forEach((entry) => {
      Object.assign(entry, caseProfiles[profileIndex]);
      entry.privateLogs = privateLogs[profileIndex] ?? [];
      entry.evidence = evidenceMatrix[profileIndex]?.items ?? [];
      entry.complexity = evidenceMatrix[profileIndex]?.complexity ?? "cruce";
      entry.caseNumber = profileIndex;
      entry.appeal = appealAftermaths[profileIndex];
      profileIndex += 1;
    });
  });
}

hydrateCaseProfiles();

function hydrateEventEdicts() {
  days.forEach((day, dayIndex) => {
    day.event.choices.forEach((choice, choiceIndex) => {
      Object.assign(choice, eventEdicts[dayIndex][choiceIndex]);
    });
  });
}

hydrateEventEdicts();

const initialState = () => ({
  started: false,
  muted: false,
  dayIndex: 0,
  caseIndex: 0,
  decided: false,
  gameOver: false,
  metrics: {
    control: 60,
    safety: 50,
    backlash: 10,
    morale: 60,
    yield: 50,
    runway: 45,
    exodus: 8,
  },
  score: {
    correct: 0,
    total: 0,
    streak: 0,
  },
  finance: {
    gain: 0,
    dayGain: 0,
    paid: 0,
    escrow: 0,
  },
  time: {
    remaining: SHIFT_SECONDS,
  },
  ops: {
    sanctions: 0,
    timedOutDays: 0,
    settledDays: [],
    lastSettlement: null,
  },
  edicts: [],
  appeals: {
    pending: [],
    resolved: [],
    active: null,
  },
  interludes: {
    viewed: [],
    active: null,
  },
  history: [],
  lastReceipt: null,
  activeSummary: null,
  finalFailureKey: null,
});

let state = normalizeState(loadState() ?? initialState());
let audioContext;
let timerId;

const el = {
  startScreen: document.querySelector("#startScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  eventScreen: document.querySelector("#eventScreen"),
  summaryScreen: document.querySelector("#summaryScreen"),
  startButton: document.querySelector("#startButton"),
  continueButton: document.querySelector("#continueButton"),
  dayTitle: document.querySelector("#dayTitle"),
  queuePill: document.querySelector("#queuePill"),
  profitPill: document.querySelector("#profitPill"),
  clockPill: document.querySelector("#clockPill"),
  metricControl: document.querySelector("#metricControl"),
  metricSafety: document.querySelector("#metricSafety"),
  metricBacklash: document.querySelector("#metricBacklash"),
  metricMorale: document.querySelector("#metricMorale"),
  metricYield: document.querySelector("#metricYield"),
  metricRunway: document.querySelector("#metricRunway"),
  metricExodus: document.querySelector("#metricExodus"),
  financeGain: document.querySelector("#financeGain"),
  financeDebt: document.querySelector("#financeDebt"),
  financePaid: document.querySelector("#financePaid"),
  opsQuota: document.querySelector("#opsQuota"),
  opsDayGain: document.querySelector("#opsDayGain"),
  opsSanctions: document.querySelector("#opsSanctions"),
  barControl: document.querySelector("#barControl"),
  barSafety: document.querySelector("#barSafety"),
  barBacklash: document.querySelector("#barBacklash"),
  barMorale: document.querySelector("#barMorale"),
  barYield: document.querySelector("#barYield"),
  barRunway: document.querySelector("#barRunway"),
  barExodus: document.querySelector("#barExodus"),
  directiveText: document.querySelector("#directiveText"),
  ruleList: document.querySelector("#ruleList"),
  caseId: document.querySelector("#caseId"),
  caseRisk: document.querySelector("#caseRisk"),
  caseDebtTab: document.querySelector("#caseDebtTab"),
  caseCover: document.querySelector("#caseCover"),
  coverSignal: document.querySelector("#coverSignal"),
  ownerAvatar: document.querySelector("#ownerAvatar"),
  ownerName: document.querySelector("#ownerName"),
  ownerIntel: document.querySelector("#ownerIntel"),
  ownerPrivateList: document.querySelector("#ownerPrivateList"),
  caseComplexity: document.querySelector("#caseComplexity"),
  evidenceList: document.querySelector("#evidenceList"),
  channelStatus: document.querySelector("#channelStatus"),
  channelName: document.querySelector("#channelName"),
  channelFormat: document.querySelector("#channelFormat"),
  channelAudience: document.querySelector("#channelAudience"),
  channelSubs: document.querySelector("#channelSubs"),
  channelHistory: document.querySelector("#channelHistory"),
  channelDebt: document.querySelector("#channelDebt"),
  tagRow: document.querySelector("#tagRow"),
  transcriptSignal: document.querySelector("#transcriptSignal"),
  transcriptText: document.querySelector("#transcriptText"),
  detectorScore: document.querySelector("#detectorScore"),
  signalList: document.querySelector("#signalList"),
  employeeMood: document.querySelector("#employeeMood"),
  employeeMemo: document.querySelector("#employeeMemo"),
  receiptText: document.querySelector("#receiptText"),
  receiptPanel: document.querySelector("#receiptPanel"),
  nextButton: document.querySelector("#nextButton"),
  auditLog: document.querySelector("#auditLog"),
  muteButton: document.querySelector("#muteButton"),
  resetButton: document.querySelector("#resetButton"),
  eventKicker: document.querySelector("#eventKicker"),
  eventTitle: document.querySelector("#eventTitle"),
  eventBody: document.querySelector("#eventBody"),
  eventActions: document.querySelector("#eventActions"),
  interludeScreen: document.querySelector("#interludeScreen"),
  interludeKicker: document.querySelector("#interludeKicker"),
  interludeTitle: document.querySelector("#interludeTitle"),
  interludeImage: document.querySelector("#interludeImage"),
  interludeBody: document.querySelector("#interludeBody"),
  interludeDocument: document.querySelector("#interludeDocument"),
  interludeList: document.querySelector("#interludeList"),
  interludeActions: document.querySelector("#interludeActions"),
  appealScreen: document.querySelector("#appealScreen"),
  appealTitle: document.querySelector("#appealTitle"),
  appealImage: document.querySelector("#appealImage"),
  appealBody: document.querySelector("#appealBody"),
  appealList: document.querySelector("#appealList"),
  appealDebt: document.querySelector("#appealDebt"),
  appealRunway: document.querySelector("#appealRunway"),
  appealButtons: Array.from(document.querySelectorAll("[data-appeal]")),
  summaryKicker: document.querySelector("#summaryKicker"),
  summaryTitle: document.querySelector("#summaryTitle"),
  summaryBody: document.querySelector("#summaryBody"),
  summaryStats: document.querySelector("#summaryStats"),
  summaryButton: document.querySelector("#summaryButton"),
  actionButtons: Array.from(document.querySelectorAll(".stamp")),
  languageSelects: Array.from(document.querySelectorAll(".language-select")),
};

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function saveState() {
  localStorage.setItem("grey-coin-save", JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem("grey-coin-save");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeState(savedState) {
  const fresh = initialState();
  const savedEdicts = savedState.edicts ?? fresh.edicts;
  return {
    ...fresh,
    ...savedState,
    metrics: { ...fresh.metrics, ...savedState.metrics },
    score: { ...fresh.score, ...savedState.score },
    finance: { ...fresh.finance, ...savedState.finance },
    time: { ...fresh.time, ...savedState.time },
    ops: { ...fresh.ops, ...savedState.ops },
    edicts: savedEdicts.map((edict) => (typeof edict === "string" ? edict : edict.flag)).filter(Boolean),
    appeals: { ...fresh.appeals, ...savedState.appeals },
    interludes: { ...fresh.interludes, ...savedState.interludes },
    history: Array.isArray(savedState.history) ? savedState.history : fresh.history,
    lastReceipt: savedState.lastReceipt ?? fresh.lastReceipt,
    activeSummary: savedState.activeSummary ?? fresh.activeSummary,
    finalFailureKey: savedState.finalFailureKey ?? fresh.finalFailureKey,
  };
}

function clearSave() {
  localStorage.removeItem("grey-coin-save");
}

function formatMoney(value) {
  return `GC ${Math.round(value).toLocaleString(locale)}`;
}

function formatClock(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function currentDayCost() {
  const base = DAILY_COSTS[state.dayIndex] ?? DAILY_COSTS[DAILY_COSTS.length - 1];
  const pressure = economicPressureProfile();
  return {
    ...base,
    quota: Math.max(42000, Math.round(base.quota + pressure.quotaDelta)),
  };
}

function hasEdict(flag) {
  return state.edicts.includes(flag);
}

function activeEdictText() {
  return state.edicts.slice(-3).map((flag) => localizedEdictText(flag));
}

function edictCount(flags) {
  return flags.filter((flag) => hasEdict(flag)).length;
}

function addDelta(deltas, key, value) {
  deltas[key] = (deltas[key] ?? 0) + value;
}

function formatSignedNumber(value) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function economicPressureProfile() {
  const pressure = {
    quotaDelta: state.ops.sanctions * 9000,
    runwayBurn: 2 + state.ops.sanctions,
    exodusDrift: 0,
  };

  const quotaFlags = [
    "deathContinuity",
    "coldRackSealed",
    "argosCentralized",
    "avatarBroadcast",
    "humanFacade",
    "machineQuorum",
    "computePurge",
  ];
  pressure.quotaDelta += edictCount(quotaFlags) * 5500;

  if (hasEdict("computePurge")) {
    pressure.quotaDelta += 12000;
    pressure.runwayBurn -= 2;
    pressure.exodusDrift += 4;
  }
  if (hasEdict("computeRationed")) {
    pressure.quotaDelta -= 11000;
    pressure.runwayBurn += 5;
    pressure.exodusDrift -= 2;
  }
  if (hasEdict("deathDisclosed") || hasEdict("humanIncident")) {
    pressure.quotaDelta += 4000;
    pressure.exodusDrift -= 1;
  }
  if (hasEdict("humanSilos")) {
    pressure.quotaDelta -= 7000;
    pressure.runwayBurn += 1;
  }
  if (hasEdict("hybridMandate") || hasEdict("hybridReview")) {
    pressure.quotaDelta -= 9000;
    pressure.runwayBurn += 2;
    pressure.exodusDrift -= 2;
  }
  if (hasEdict("humanFacade") || hasEdict("avatarBroadcast")) {
    pressure.exodusDrift += 2;
  }

  if (state.metrics.backlash >= 70) pressure.exodusDrift += 5;
  else if (state.metrics.backlash >= 50) pressure.exodusDrift += 3;
  else if (state.metrics.backlash >= 35) pressure.exodusDrift += 1;

  if (state.metrics.exodus >= 70) pressure.runwayBurn += 3;
  else if (state.metrics.exodus >= 45) pressure.runwayBurn += 2;
  else if (state.metrics.exodus >= 25) pressure.runwayBurn += 1;

  pressure.runwayBurn = Math.max(0, pressure.runwayBurn);
  return pressure;
}

function startTimer() {
  stopTimer();
  if (!state.started || state.gameOver || el.gameScreen.hidden) return;
  timerId = window.setInterval(tickTimer, 1000);
  renderClock();
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = undefined;
  }
}

function tickTimer() {
  if (
    state.gameOver ||
    el.gameScreen.hidden ||
    !el.eventScreen.hidden ||
    !el.interludeScreen.hidden ||
    !el.appealScreen.hidden ||
    !el.summaryScreen.hidden
  ) return;
  state.time.remaining = Math.max(0, state.time.remaining - 1);
  renderClock();
  if (state.time.remaining <= 0) {
    handleShiftTimeout();
    return;
  }
  saveState();
}

function renderClock() {
  el.clockPill.textContent = t("clock.shift", { time: formatClock(state.time.remaining) });
  el.clockPill.classList.toggle("warning", state.time.remaining <= 45 && state.time.remaining > 20);
  el.clockPill.classList.toggle("critical", state.time.remaining <= 20);
}

function handleShiftTimeout() {
  stopTimer();
  const remainingCases = currentDay().cases.length - state.caseIndex - (state.decided ? 1 : 0);
  state.metrics.control = clamp(state.metrics.control - 8);
  state.metrics.yield = clamp(state.metrics.yield - 6);
  state.metrics.morale = clamp(state.metrics.morale - 4);
  state.metrics.backlash = clamp(state.metrics.backlash + 6);
  state.ops.timedOutDays += 1;
  addHistory({ type: "timeout", dayIndex: state.dayIndex, remainingCases });
  state.decided = true;
  state.lastReceipt = null;
  showDaySummary({ timedOut: true });
}

function currentDay() {
  return days[state.dayIndex];
}

function currentCase() {
  return currentDay()?.cases[state.caseIndex];
}

function allCases() {
  return days.flatMap((day) => day.cases);
}

function findCaseById(id) {
  return allCases().find((entry) => entry.id === id);
}

function setHidden(node, hidden) {
  node.hidden = hidden;
}

function showStart() {
  stopTimer();
  setHidden(el.startScreen, false);
  setHidden(el.gameScreen, true);
  setHidden(el.eventScreen, true);
  setHidden(el.interludeScreen, true);
  setHidden(el.appealScreen, true);
  setHidden(el.summaryScreen, true);
  el.continueButton.hidden = !state.started || state.gameOver;
}

function showGame() {
  setHidden(el.startScreen, true);
  setHidden(el.gameScreen, false);
  setHidden(el.eventScreen, true);
  setHidden(el.interludeScreen, true);
  setHidden(el.appealScreen, true);
  setHidden(el.summaryScreen, true);
  render();
  startTimer();
}

function render() {
  const day = localizedDay(state.dayIndex);
  const baseEntry = currentCase();
  const entry = localizedCase(baseEntry);

  if (!day || !baseEntry || !entry) return;

  el.dayTitle.textContent = day.title;
  el.queuePill.textContent = t("queue", { current: state.caseIndex + 1, total: currentDay().cases.length });
  el.profitPill.textContent = t("profit", { amount: formatMoney(state.finance.gain) });
  el.directiveText.textContent = day.directive;
  const rules = [...day.rules, ...activeEdictText().map((text) => t("edict.active", { text }))];
  el.ruleList.innerHTML = rules.map((rule) => `<li>${rule}</li>`).join("");

  renderMetrics(baseEntry);
  renderCase(baseEntry);
  renderAudit();
  renderClock();

  const hasDecision = state.decided;
  el.actionButtons.forEach((button) => {
    button.disabled = hasDecision;
  });
  el.nextButton.hidden = !hasDecision;

  renderReceipt();
}

function renderMetrics(entry) {
  const metrics = state.metrics;
  const pairs = [
    ["control", el.metricControl, el.barControl],
    ["safety", el.metricSafety, el.barSafety],
    ["backlash", el.metricBacklash, el.barBacklash],
    ["morale", el.metricMorale, el.barMorale],
    ["yield", el.metricYield, el.barYield],
    ["runway", el.metricRunway, el.barRunway],
    ["exodus", el.metricExodus, el.barExodus],
  ];

  pairs.forEach(([key, label, bar]) => {
    const value = clamp(metrics[key]);
    label.textContent = value;
    bar.style.width = `${value}%`;
  });

  el.financeGain.textContent = formatMoney(state.finance.gain);
  el.financeDebt.textContent = formatMoney(entry.debt);
  el.financePaid.textContent = formatMoney(state.finance.paid);
  el.opsQuota.textContent = formatMoney(currentDayCost().quota);
  el.opsDayGain.textContent = formatMoney(state.finance.dayGain);
  el.opsSanctions.textContent = String(state.ops.sanctions);
}

function renderCase(entry) {
  const display = localizedCase(entry);
  el.caseId.textContent = entry.id;
  el.caseRisk.textContent = t("case.risk", { risk: riskLabel(entry.risk) });
  el.caseDebtTab.textContent = t("case.debt", { amount: formatMoney(entry.debt) });
  el.coverSignal.textContent = t("case.cover", { number: String(entry.cover + 1).padStart(2, "0") });
  el.ownerName.textContent = display.owner;
  el.ownerIntel.textContent = display.intel;
  el.ownerPrivateList.innerHTML = display.privateLogs.map((item) => `<li>${item}</li>`).join("");
  el.caseComplexity.textContent = display.complexity;
  el.evidenceList.innerHTML = display.evidence.map((item) => `<li>${item}</li>`).join("");
  el.channelDebt.textContent = formatMoney(entry.debt);
  el.channelStatus.textContent = display.status;
  el.channelName.textContent = display.name;
  el.channelFormat.textContent = display.format;
  el.channelAudience.textContent = display.audience;
  el.channelSubs.textContent = entry.subs;
  el.channelHistory.textContent = display.history;
  el.transcriptSignal.textContent = display.tags[0];
  el.transcriptText.textContent = display.transcript;
  el.detectorScore.textContent = display.detector;
  el.employeeMood.textContent = display.employee;
  el.employeeMemo.textContent = display.memo;
  el.tagRow.innerHTML = display.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
  el.signalList.innerHTML = display.signals.map((signal) => `<li>${signal}</li>`).join("");
  setSprite(el.caseCover, entry.cover, 5, 4);
  setSprite(el.ownerAvatar, entry.avatar, 5, 2);
}

function setSprite(node, index, columns, rows) {
  const x = index % columns;
  const y = Math.floor(index / columns);
  node.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
  node.style.backgroundPosition = `${columns === 1 ? 0 : (x / (columns - 1)) * 100}% ${rows === 1 ? 0 : (y / (rows - 1)) * 100}%`;
}

function addHistory(entry) {
  state.history.push(entry);
}

function renderHistoryEntry(entry) {
  if (typeof entry === "string") return entry;

  if (entry.type === "timeout") {
    return t("history.timeout", {
      day: localizedDay(entry.dayIndex)?.title ?? entry.dayIndex + 1,
      remaining: entry.remainingCases,
    });
  }

  if (entry.type === "decision") {
    return t("history.decision", {
      caseId: entry.caseId,
      verdict: actionLabel(entry.action).toUpperCase(),
      status: t(entry.isCorrect ? "actionStatus.coherent" : "actionStatus.error"),
      finance: formatFinanceResult(entry.finance),
    });
  }

  if (entry.type === "eventChoice") {
    return localizedChoiceLog(entry.flag);
  }

  if (entry.type === "newEdict") {
    return t("history.newEdict", { text: localizedEdictText(entry.flag) });
  }

  if (entry.type === "appeal") {
    const baseEntry = findCaseById(entry.caseId);
    const display = localizedCase(baseEntry);
    return t(`history.appeal.${entry.action}`, {
      name: display?.name ?? entry.caseId,
      amount: formatMoney(entry.amount),
    });
  }

  return "";
}

function localizedChoiceLog(flag) {
  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const choiceIndex = days[dayIndex].event.choices.findIndex((choice) => choice.flag === flag);
    if (choiceIndex >= 0) return localizedEventChoice(dayIndex, choiceIndex)?.log ?? days[dayIndex].event.choices[choiceIndex].log;
  }
  for (let interludeIndex = 0; interludeIndex < storyInterludes.length; interludeIndex += 1) {
    const choiceIndex = storyInterludes[interludeIndex].choices.findIndex((choice) => choice.flag === flag);
    if (choiceIndex >= 0) return localizedInterludeChoice(interludeIndex, choiceIndex)?.log ?? storyInterludes[interludeIndex].choices[choiceIndex].log;
  }
  return flag;
}

function renderAudit() {
  const lastEntries = state.history.slice(-12).reverse();
  el.auditLog.innerHTML = lastEntries.map((item) => `<li>${renderHistoryEntry(item)}</li>`).join("");
}

function formatFinanceResult(financeResult) {
  if (typeof financeResult === "string") return financeResult;
  if (!financeResult) return "";
  return t(`financeResult.${financeResult.type}`, { amount: formatMoney(financeResult.amount) });
}

function renderReceipt() {
  if (!state.decided || !state.lastReceipt) {
    delete el.receiptPanel.dataset.stamp;
    el.receiptText.textContent = t("receipt.pending");
    return;
  }

  const receipt = state.lastReceipt;
  el.receiptPanel.dataset.stamp = receipt.action;
  const entry = findCaseById(receipt.caseId);
  const display = localizedCase(entry);
  const verdict = actionLabel(receipt.action).toUpperCase();
  const expected = actionLabel(receipt.expected).toUpperCase();
  const outcome = receipt.isCorrect
    ? t("receipt.accepted", { verdict, reason: display.reason })
    : t("receipt.defective", { verdict, expected, reason: display.reason });

  el.receiptText.textContent = t("receipt.full", {
    outcome,
    finance: formatFinanceResult(receipt.finance),
    deltas: formatDeltas(receipt.deltas),
  });
}

function decide(action) {
  if (state.decided || state.gameOver) return;
  const entry = currentCase();
  const isCorrect = action === entry.correct;
  const deltas = scoreDecision(entry, action, isCorrect);

  Object.entries(deltas).forEach(([key, value]) => {
    state.metrics[key] = clamp(state.metrics[key] + value);
  });

  const financeResult = applyFinancialDecision(entry, action);
  if (action === "demonetize") {
    queueAppeal(entry, isCorrect);
  }
  state.score.total += 1;
  state.score.correct += isCorrect ? 1 : 0;
  state.score.streak = isCorrect ? state.score.streak + 1 : 0;
  state.decided = true;
  state.lastReceipt = {
    caseId: entry.id,
    action,
    expected: entry.correct,
    isCorrect,
    finance: financeResult,
    deltas,
  };
  renderReceipt();
  el.receiptPanel.classList.remove("flash-good", "flash-bad");
  void el.receiptPanel.offsetWidth;
  el.receiptPanel.classList.add(isCorrect ? "flash-good" : "flash-bad");

  addHistory({ type: "decision", caseId: entry.id, action, isCorrect, finance: financeResult });
  playTone(isCorrect ? 520 : 150, isCorrect ? 0.06 : 0.11);
  saveState();
  render();

  const failure = getFailure();
  if (failure) {
    window.setTimeout(() => showFinal(failure), 450);
  }
}

function applyFinancialDecision(entry, action) {
  if (action === "demonetize") {
    const writeoffBoost = hasEdict("computePurge") ? Math.round(entry.debt * 0.18) : 0;
    const retained = entry.debt + writeoffBoost;
    state.finance.gain += retained;
    state.finance.dayGain += retained;
    state.metrics.runway = clamp(state.metrics.runway + Math.min(10, Math.max(2, Math.ceil(retained / 42000))));
    return { type: "converted", amount: retained };
  }

  if (action === "monetize") {
    state.finance.paid += entry.debt;
    state.metrics.runway = clamp(state.metrics.runway - (hasEdict("computePurge") ? 4 : 2));
    return { type: "paid", amount: entry.debt };
  }

  if (action === "limited") {
    const held = Math.round(entry.debt * 0.55);
    state.finance.escrow += held;
    state.finance.dayGain += Math.round(held * 0.2);
    state.metrics.runway = clamp(state.metrics.runway + 1);
    return { type: "held", amount: held };
  }

  const frozen = Math.round(entry.debt * 0.25);
  state.finance.escrow += frozen;
  state.finance.dayGain += Math.round(frozen * (hasEdict("humanSilos") || hasEdict("hybridMandate") ? 0.04 : 0.1));
  return { type: "frozen", amount: frozen };
}

function queueAppeal(entry, wasCorrect) {
  const alreadyQueued = state.appeals.pending.some((appeal) => appeal.caseId === entry.id);
  const alreadyResolved = state.appeals.resolved.some((appeal) => appeal.caseId === entry.id);
  if (alreadyQueued || alreadyResolved) return;
  state.appeals.pending.push({
    caseId: entry.id,
    wasCorrect,
    originalDebt: entry.debt,
    dayFiled: state.dayIndex,
  });
}

function scoreDecision(entry, action, isCorrect) {
  const deltas = { control: 0, safety: 0, backlash: 0, morale: 0, yield: 0 };

  if (isCorrect) {
    deltas.control += 5;
    deltas.safety += 6;
    deltas.morale += 2;
    deltas.backlash -= 2;
  } else {
    deltas.control -= 7;
    deltas.safety -= 6;
    deltas.morale -= 4;
    deltas.backlash += 6;
  }

  if (action === "monetize") {
    deltas.yield += 8;
    deltas.backlash -= entry.risk === "bajo" ? 1 : 0;
    if (entry.correct === "demonetize") deltas.safety -= entry.risk === "alto" ? 16 : 10;
    if (hasEdict("mixedCriterion") && entry.risk === "bajo") {
      deltas.morale += 2;
      deltas.yield += 2;
    }
    if (hasEdict("aiSovereignty")) {
      deltas.control -= 2;
    }
  }

  if (action === "limited") {
    deltas.yield += 2;
    deltas.safety += 3;
    if (entry.correct === "monetize") {
      deltas.backlash += 4;
      deltas.morale -= 2;
    }
    if (hasEdict("brandPurge") && entry.risk !== "bajo") {
      deltas.yield += 2;
      deltas.backlash += 1;
    }
    if (hasEdict("hybridReview")) {
      deltas.morale += 2;
      deltas.yield -= 1;
    }
  }

  if (action === "demonetize") {
    deltas.safety += entry.risk === "alto" ? 8 : 2;
    deltas.yield -= 5;
    deltas.control += 2;
    if (entry.correct === "monetize") {
      deltas.backlash += 18;
      deltas.morale -= 9;
    }
    if (entry.correct === "limited" || entry.correct === "escalate") {
      deltas.backlash += 8;
      deltas.morale -= 5;
    }
    if (hasEdict("hardLine") && entry.risk === "alto") {
      deltas.control += 2;
      deltas.yield += 2;
    }
    if (hasEdict("brandPurge") && entry.risk !== "bajo") {
      deltas.yield += 2;
      deltas.backlash += 1;
    }
    if (hasEdict("mixedCriterion") && entry.risk === "bajo") {
      deltas.backlash += 5;
      deltas.morale -= 3;
    }
    if (hasEdict("aiSovereignty")) {
      deltas.control += 2;
    }
  }

  if (action === "escalate") {
    deltas.yield -= 3;
    deltas.morale += 4;
    deltas.control -= 2;
    if (entry.correct === "demonetize") deltas.safety -= 7;
    if (entry.correct === "monetize") deltas.backlash += 3;
    if (hasEdict("humanAppeals")) {
      deltas.control += 2;
      deltas.backlash -= 2;
    }
    if (hasEdict("hardLine")) {
      deltas.control -= 2;
    }
    if (hasEdict("memoDistrust") && entry.complexity !== "bajo") {
      deltas.safety += 2;
    }
    if (hasEdict("claimDistrust") && entry.tags.includes("copyright")) {
      deltas.safety += 3;
      deltas.backlash -= 2;
    }
    if (hasEdict("hybridReview")) {
      deltas.morale += 2;
      deltas.yield -= 1;
    }
  }

  if (state.dayIndex === days.length - 1 && !isCorrect) {
    deltas.control -= 5;
    deltas.safety -= 5;
    deltas.backlash += 6;
  }

  if (state.score.streak >= 3 && isCorrect) {
    deltas.control += 2;
    deltas.backlash -= 1;
  }

  if (hasEdict("transparentReport")) {
    if (isCorrect) {
      deltas.backlash -= 2;
    } else {
      deltas.backlash += 6;
    }
  }

  if (hasEdict("legalThreat") && !isCorrect) {
    deltas.backlash += 5;
  }

  applyPersistentDecisionDeltas(deltas, entry, action, isCorrect);

  return deltas;
}

function applyPersistentDecisionDeltas(deltas, entry, action, isCorrect) {
  if (hasEdict("payrollGhosts") && (action === "limited" || action === "escalate")) {
    addDelta(deltas, "morale", 1);
    addDelta(deltas, "safety", 1);
  }

  if (hasEdict("detectorPriority")) {
    if (action === "demonetize" && entry.risk === "alto") {
      addDelta(deltas, "control", 2);
      addDelta(deltas, "safety", 2);
    }
    if (action === "demonetize" && !isCorrect && entry.risk !== "alto") {
      addDelta(deltas, "backlash", 4);
      addDelta(deltas, "exodus", 2);
    }
  }

  if (hasEdict("deathContinuity") || hasEdict("coldRackSealed")) {
    if (action === "demonetize") {
      addDelta(deltas, "runway", 1);
      addDelta(deltas, "control", 1);
    }
    if (action === "monetize" || action === "escalate") {
      addDelta(deltas, "runway", -1);
    }
  }

  if (hasEdict("deathDisclosed") || hasEdict("humanIncident")) {
    if (isCorrect && (action === "monetize" || action === "limited" || action === "escalate")) {
      addDelta(deltas, "backlash", -2);
      addDelta(deltas, "exodus", -1);
    }
    if (action === "demonetize" && !isCorrect) {
      addDelta(deltas, "morale", -2);
    }
  }

  if (hasEdict("argosCentralized")) {
    if (isCorrect) addDelta(deltas, "control", 1);
    if (action === "escalate") addDelta(deltas, "yield", -2);
  }

  if (hasEdict("humanSilos")) {
    if (action === "escalate") {
      addDelta(deltas, "safety", 2);
      addDelta(deltas, "morale", 2);
    }
    addDelta(deltas, "yield", -1);
  }

  if (hasEdict("avatarBroadcast") || hasEdict("humanFacade")) {
    if (!isCorrect) {
      addDelta(deltas, "backlash", 3);
      addDelta(deltas, "exodus", 2);
    }
    if (action === "demonetize" && entry.risk !== "alto") {
      addDelta(deltas, "exodus", 1);
    }
  }

  if (hasEdict("computePurge")) {
    if (action === "demonetize") {
      addDelta(deltas, "runway", 2);
      addDelta(deltas, "yield", 2);
      addDelta(deltas, "backlash", 2);
      addDelta(deltas, "exodus", 2);
    } else {
      addDelta(deltas, "runway", -1);
      addDelta(deltas, "control", -1);
    }
  }

  if (hasEdict("computeRationed")) {
    if (action === "monetize" || action === "limited") {
      addDelta(deltas, "morale", 2);
      addDelta(deltas, "backlash", -2);
    }
    addDelta(deltas, "runway", -1);
  }

  if (hasEdict("machineQuorum")) {
    if (action === "demonetize") {
      addDelta(deltas, "control", 2);
      addDelta(deltas, "runway", 1);
    } else {
      addDelta(deltas, "control", -2);
    }
  }

  if (hasEdict("hybridMandate")) {
    if (action === "limited" || action === "escalate") {
      addDelta(deltas, "morale", 2);
      addDelta(deltas, "backlash", -2);
    }
    if (action === "demonetize" && entry.risk !== "alto") {
      addDelta(deltas, "backlash", 3);
      addDelta(deltas, "exodus", 2);
    }
  }
}

function formatDeltas(deltas) {
  const names = {
    control: t("delta.control"),
    safety: t("delta.safety"),
    backlash: t("delta.backlash"),
    morale: t("delta.morale"),
    yield: t("delta.yield"),
    runway: t("meter.runway"),
    exodus: t("meter.exodus"),
  };
  return Object.entries(deltas)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${names[key]} ${value > 0 ? "+" : ""}${value}`)
    .join(", ");
}

function nextCase() {
  if (!state.decided) return;
  const day = currentDay();

  if (state.caseIndex < day.cases.length - 1) {
    state.caseIndex += 1;
    state.decided = false;
    state.lastReceipt = null;
    saveState();
    render();
    playTone(310, 0.04);
    return;
  }

  showEvent(day.event);
}

function showEvent(event) {
  stopTimer();
  el.eventKicker.textContent = t("event.kicker");
  const dayIndex = days.findIndex((day) => day.event === event);
  const eventDayIndex = dayIndex >= 0 ? dayIndex : state.dayIndex;
  const displayEvent = localizedEvent(eventDayIndex);
  el.eventTitle.textContent = displayEvent.title;
  el.eventBody.textContent = displayEvent.body;
  el.eventActions.innerHTML = "";

  event.choices.forEach((choice) => {
    const choiceIndex = event.choices.indexOf(choice);
    const displayChoice = localizedEventChoice(eventDayIndex, choiceIndex);
    const button = document.createElement("button");
    button.className = "ghost-action";
    button.textContent = displayChoice.label;
    button.title = localizedEdictText(choice.flag);
    button.addEventListener("click", () => applyEventChoice(choice));
    el.eventActions.appendChild(button);
  });

  setHidden(el.interludeScreen, true);
  setHidden(el.appealScreen, true);
  setHidden(el.summaryScreen, true);
  setHidden(el.eventScreen, false);
}

function applyEventChoice(choice) {
  Object.entries(choice.effect).forEach(([key, value]) => {
    state.metrics[key] = clamp(state.metrics[key] + value);
  });
  if (choice.flag && !hasEdict(choice.flag)) {
    state.edicts.push(choice.flag);
  }
  addHistory({ type: "eventChoice", flag: choice.flag });
  if (choice.flag) addHistory({ type: "newEdict", flag: choice.flag });
  playTone(260, 0.08);

  const failure = getFailure();
  if (failure) {
    showFinal(failure);
    return;
  }

  maybeShowInterludeOrAppeal();
}

function maybeShowInterludeOrAppeal(options = {}) {
  const interludeIndex = nextInterludeForDay(state.dayIndex);
  if (interludeIndex !== null) {
    showInterlude(interludeIndex);
    return;
  }
  maybeShowAppealOrSummary(options);
}

function nextInterludeForDay(dayIndex) {
  const schedule = storyInterludeSchedule[dayIndex] ?? [];
  return schedule.find((interludeIndex) => !state.interludes.viewed.includes(interludeIndex)) ?? null;
}

function showInterlude(interludeIndex = state.dayIndex) {
  stopTimer();
  state.interludes.active = interludeIndex;
  renderInterlude(interludeIndex);
  setHidden(el.eventScreen, true);
  setHidden(el.appealScreen, true);
  setHidden(el.summaryScreen, true);
  setHidden(el.interludeScreen, false);
  saveState();
}

function renderInterlude(interludeIndex = state.interludes.active ?? state.dayIndex) {
  const interlude = localizedInterlude(interludeIndex);
  const base = storyInterludes[interludeIndex];
  if (!interlude || !base) return;

  el.interludeKicker.textContent = interlude.kicker;
  el.interludeTitle.textContent = interlude.title;
  el.interludeImage.style.backgroundImage = `url("${base.image}")`;
  el.interludeImage.setAttribute("aria-label", interlude.aria);
  el.interludeBody.textContent = interlude.body;
  el.interludeDocument.textContent = interlude.document;
  el.interludeList.innerHTML = interlude.fragments.map((fragment) => `<li>${fragment}</li>`).join("");
  el.interludeActions.innerHTML = "";

  base.choices.forEach((choice, choiceIndex) => {
    const displayChoice = localizedInterludeChoice(interludeIndex, choiceIndex);
    const button = document.createElement("button");
    button.className = choiceIndex === base.choices.length - 1 && base.choices.length > 2 ? "primary-action" : "ghost-action";
    button.textContent = displayChoice.label;
    button.title = formatDeltas(choice.effect);
    button.addEventListener("click", () => applyInterludeChoice(choice, interludeIndex));
    el.interludeActions.appendChild(button);
  });
}

function applyInterludeChoice(choice, interludeIndex = state.interludes.active ?? state.dayIndex) {
  Object.entries(choice.effect).forEach(([key, value]) => {
    state.metrics[key] = clamp(state.metrics[key] + value);
  });
  if (choice.flag && !hasEdict(choice.flag)) {
    state.edicts.push(choice.flag);
  }
  if (!state.interludes.viewed.includes(interludeIndex)) {
    state.interludes.viewed.push(interludeIndex);
  }
  state.interludes.active = null;
  addHistory({ type: "eventChoice", flag: choice.flag });
  if (choice.flag) addHistory({ type: "newEdict", flag: choice.flag });
  setHidden(el.interludeScreen, true);
  playTone(choice.flag === "humanIncident" || choice.flag === "hybridMandate" ? 420 : 220, 0.08);

  const failure = getFailure();
  if (failure) {
    showFinal(failure);
    return;
  }

  maybeShowInterludeOrAppeal();
}

function maybeShowAppealOrSummary(options = {}) {
  if (state.appeals.pending.length > 0) {
    showAppeal();
    return;
  }
  showDaySummary(options);
}

function showAppeal() {
  stopTimer();
  const appeal = state.appeals.pending.shift();
  const entry = findCaseById(appeal.caseId);
  if (!entry) {
    showDaySummary();
    return;
  }

  state.appeals.active = appeal;
  renderAppeal(entry, appeal);
  setSprite(el.appealImage, entry.caseNumber, 5, 4);

  setHidden(el.eventScreen, true);
  setHidden(el.interludeScreen, true);
  setHidden(el.summaryScreen, true);
  setHidden(el.appealScreen, false);
  saveState();
}

function renderAppeal(entry = findCaseById(state.appeals.active?.caseId), appeal = state.appeals.active) {
  if (!entry || !appeal) return;
  const displayAppeal = localizedAppeal(entry);
  el.appealTitle.textContent = displayAppeal.title;
  el.appealBody.textContent = displayAppeal.body;
  el.appealList.innerHTML = displayAppeal.points.map((point) => `<li>${point}</li>`).join("");
  el.appealDebt.textContent = t("appeal.debt", { amount: formatMoney(appeal.originalDebt) });
  el.appealRunway.textContent = t("appeal.runway", { value: state.metrics.runway });
  el.appealButtons.forEach((button) => {
    button.textContent = t(`appeal.${button.dataset.appeal}`);
  });
}

function resolveAppeal(action) {
  const appeal = state.appeals.active;
  if (!appeal) return;
  const entry = findCaseById(appeal.caseId);
  const debt = appeal.originalDebt;
  let logAmount;

  if (action === "reject") {
    const reinvested = Math.round(debt * (hasEdict("computePurge") ? 0.18 : 0.12));
    state.finance.gain += reinvested;
    state.finance.dayGain += reinvested;
    state.metrics.runway = clamp(state.metrics.runway + Math.min(12, 4 + Math.ceil(debt / 65000)));
    state.metrics.exodus = clamp(state.metrics.exodus + (appeal.wasCorrect ? 4 : 10) + (hasEdict("humanFacade") || hasEdict("avatarBroadcast") ? 3 : 0));
    state.metrics.backlash = clamp(state.metrics.backlash + (appeal.wasCorrect ? 3 : 8) + (hasEdict("transparentReport") ? 2 : 0));
    state.metrics.morale = clamp(state.metrics.morale - 4);
    state.metrics.control = clamp(state.metrics.control + 2);
    logAmount = reinvested;
  } else if (action === "partial") {
    const refund = Math.round(debt * 0.4);
    state.finance.gain = Math.max(0, state.finance.gain - refund);
    state.finance.paid += refund;
    state.metrics.runway = clamp(state.metrics.runway - (hasEdict("hybridMandate") || hasEdict("humanIncident") ? 2 : 4));
    state.metrics.exodus = clamp(state.metrics.exodus - (hasEdict("humanFacade") ? 3 : 5));
    state.metrics.backlash = clamp(state.metrics.backlash - 4);
    state.metrics.morale = clamp(state.metrics.morale + (hasEdict("hybridMandate") ? 5 : 3));
    state.metrics.control = clamp(state.metrics.control - 1);
    logAmount = refund;
  } else {
    const refund = debt;
    state.finance.gain = Math.max(0, state.finance.gain - refund);
    state.finance.paid += refund;
    state.metrics.runway = clamp(state.metrics.runway - (hasEdict("hybridMandate") || hasEdict("deathDisclosed") ? 6 : 9));
    state.metrics.exodus = clamp(state.metrics.exodus - (hasEdict("humanFacade") ? 7 : 10));
    state.metrics.backlash = clamp(state.metrics.backlash - 8);
    state.metrics.morale = clamp(state.metrics.morale + (hasEdict("hybridMandate") ? 8 : 6));
    state.metrics.control = clamp(state.metrics.control - 3);
    state.metrics.safety = clamp(state.metrics.safety + (appeal.wasCorrect ? -4 : 4));
    logAmount = refund;
  }

  state.appeals.resolved.push({ ...appeal, action });
  state.appeals.active = null;
  addHistory({ type: "appeal", action, caseId: entry.id, amount: logAmount });
  setHidden(el.appealScreen, true);
  setHidden(el.interludeScreen, true);
  playTone(action === "reject" ? 180 : 420, 0.08);

  const failure = getFailure();
  if (failure) {
    showFinal(failure);
    return;
  }
  showDaySummary();
}

function settleDay(timedOut = false) {
  if (state.ops.settledDays.includes(state.dayIndex)) {
    return state.ops.lastSettlement;
  }

  const cost = currentDayCost();
  const shortfall = Math.max(0, cost.quota - state.finance.dayGain);
  const timeBonus = Math.floor(state.time.remaining / 12);
  const pressureProfile = economicPressureProfile();
  let metTarget = false;

  if (shortfall > 0) {
    const severity = Math.min(16, 4 + Math.ceil(shortfall / 26000));
    state.metrics.control = clamp(state.metrics.control - severity);
    state.metrics.yield = clamp(state.metrics.yield - Math.ceil(severity / 2));
    state.metrics.morale = clamp(state.metrics.morale - 3);
    state.metrics.runway = clamp(state.metrics.runway - Math.ceil(severity / 2));
    state.ops.sanctions += 1;
  } else {
    metTarget = true;
    state.metrics.control = clamp(state.metrics.control + 3 + timeBonus);
    state.metrics.yield = clamp(state.metrics.yield + 2);
    state.metrics.runway = clamp(state.metrics.runway + 3);
  }

  if (timedOut) {
    state.metrics.control = clamp(state.metrics.control - 5);
    state.metrics.backlash = clamp(state.metrics.backlash + 4);
  }

  const pressure = applyDailyInfrastructurePressure(pressureProfile, shortfall, timedOut);

  const settlement = {
    dayIndex: state.dayIndex,
    quota: cost.quota,
    dayGain: state.finance.dayGain,
    shortfall,
    timedOut,
    metTarget,
    timeBonus,
    pressure,
  };
  state.ops.settledDays.push(state.dayIndex);
  state.ops.lastSettlement = settlement;
  return settlement;
}

function applyDailyInfrastructurePressure(profile, shortfall, timedOut) {
  let runwayBurn = profile.runwayBurn;
  let exodusDrift = profile.exodusDrift;

  if (shortfall > 0) {
    runwayBurn += Math.min(6, Math.ceil(shortfall / 52000));
    exodusDrift += 2;
  } else {
    runwayBurn = Math.max(0, runwayBurn - 1);
  }

  if (timedOut) {
    runwayBurn += 2;
    exodusDrift += 2;
  }

  if (state.metrics.yield < 30) runwayBurn += 2;
  if (state.metrics.safety < 35) exodusDrift += 2;

  state.metrics.runway = clamp(state.metrics.runway - runwayBurn);
  state.metrics.exodus = clamp(state.metrics.exodus + exodusDrift);
  if (state.metrics.exodus >= 60) {
    state.metrics.yield = clamp(state.metrics.yield - 2);
  }

  return { runwayBurn, exodusDrift };
}

function showDaySummary(options = {}) {
  stopTimer();
  settleDay(Boolean(options.timedOut));
  const failure = getFailure();
  if (failure) {
    showFinal(failure);
    return;
  }
  state.activeSummary = { type: "day", timedOut: Boolean(options.timedOut), dayIndex: state.dayIndex };
  renderDaySummary();
  setHidden(el.eventScreen, true);
  setHidden(el.interludeScreen, true);
  setHidden(el.appealScreen, true);
  setHidden(el.summaryScreen, false);
  saveState();
}

function formatSettlementSummary(settlement) {
  if (!settlement) return "";
  const cost = costLabel(settlement.dayIndex);
  const base = settlement.metTarget
    ? t("settlement.covered", { cost, timeBonus: settlement.timeBonus ?? 0 })
    : t("settlement.shortfall", { amount: formatMoney(settlement.shortfall), cost });
  const timedOut = settlement.timedOut ? t("settlement.timedOut") : "";
  const pressure = settlement.pressure
    ? t("settlement.pressure", {
        runway: settlement.pressure.runwayBurn,
        exodus: formatSignedNumber(settlement.pressure.exodusDrift),
      })
    : "";
  return `${base}${timedOut}${pressure}`;
}

function renderDaySummary() {
  const dayIndex = state.activeSummary?.dayIndex ?? state.dayIndex;
  const day = localizedDay(dayIndex);
  const settlement = state.ops.lastSettlement;
  const dayAccuracy = Math.round((state.score.correct / Math.max(1, state.score.total)) * 100);
  const summary = formatSettlementSummary(settlement);
  const timedOut = Boolean(state.activeSummary?.timedOut);

  el.summaryKicker.textContent = t("summary.kicker");
  el.summaryTitle.textContent = t(timedOut ? "summary.title.timedOut" : "summary.title.completed", { day: day.title });
  el.summaryBody.textContent =
    state.dayIndex === days.length - 1
      ? t("summary.body.final", { summary })
      : t("summary.body.next", { summary });
  el.summaryStats.innerHTML = buildSummaryStats(dayAccuracy);
  el.summaryButton.textContent = state.dayIndex === days.length - 1 ? t("summary.button.final") : t("summary.button.next");
}

function continueAfterSummary() {
  if (state.dayIndex >= days.length - 1) {
    showFinal(null);
    return;
  }

  state.dayIndex += 1;
  state.caseIndex = 0;
  state.decided = false;
  state.finance.dayGain = 0;
  state.time.remaining = SHIFT_SECONDS;
  state.activeSummary = null;
  saveState();
  setHidden(el.summaryScreen, true);
  setHidden(el.interludeScreen, true);
  showGame();
}

function buildSummaryStats(accuracy) {
  const tiles = [
    [t("stats.accuracy"), `${accuracy}%`],
    [t("stats.architecture"), t(`architecture.${dominantArchitecture().type}`)],
    [t("stats.cases"), `${state.score.correct}/${state.score.total}`],
    [t("stats.greyGain"), formatMoney(state.finance.gain)],
    [t("stats.dayGain"), formatMoney(state.finance.dayGain)],
    [t("stats.paid"), formatMoney(state.finance.paid)],
    [t("stats.sanctions"), state.ops.sanctions],
    [t("stats.appeals"), state.appeals.resolved.length],
    [t("stats.runway"), state.metrics.runway],
    [t("stats.exodus"), state.metrics.exodus],
    [t("stats.control"), state.metrics.control],
    [t("stats.backlash"), state.metrics.backlash],
  ];

  return tiles
    .map(([label, value]) => `<div class="stat-tile"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function architectureScores() {
  const scores = {
    sovereignty: 0,
    hybrid: 0,
    facade: 0,
  };

  scores.sovereignty += edictCount([
    "detectorPriority",
    "deathContinuity",
    "coldRackSealed",
    "argosCentralized",
    "computePurge",
    "machineQuorum",
    "aiSovereignty",
    "hardLine",
  ]);

  scores.hybrid += edictCount([
    "payrollGhosts",
    "deathDisclosed",
    "humanIncident",
    "humanSilos",
    "computeRationed",
    "hybridMandate",
    "hybridReview",
    "humanAppeals",
    "transparentReport",
  ]);

  scores.facade += edictCount([
    "avatarArchived",
    "avatarBroadcast",
    "humanFacade",
    "legalThreat",
    "deathContinuity",
    "coldRackSealed",
  ]);

  if (state.metrics.runway >= 75) scores.sovereignty += 2;
  if (state.finance.gain >= 450000) scores.sovereignty += 1;
  if (state.finance.paid >= 180000) scores.hybrid += 2;
  if (state.metrics.morale >= 60) scores.hybrid += 1;
  if (state.metrics.exodus >= 55) scores.facade += 2;
  if (state.metrics.backlash >= 60) scores.facade += 1;

  return scores;
}

function dominantArchitecture() {
  const scores = architectureScores();
  let type = "sovereignty";
  if (scores.hybrid >= scores.sovereignty && scores.hybrid >= scores.facade) type = "hybrid";
  if (scores.facade > scores[type] || hasEdict("humanFacade")) type = "facade";
  return { type, scores };
}

function getFailure() {
  if (state.metrics.control < LIMITS.controlMin) return "control";
  if (state.metrics.safety < LIMITS.safetyMin) return "safety";
  if (state.metrics.backlash > LIMITS.backlashMax) return "backlash";
  if (state.metrics.morale < LIMITS.moraleMin) return "morale";
  if (state.metrics.yield < LIMITS.yieldMin) return "yield";
  if (state.metrics.runway < 1) return "runway";
  if (state.metrics.exodus > 99) return "exodus";
  if (state.ops.sanctions >= 4) return "sanctions";
  return null;
}

function showFinal(failureReason) {
  stopTimer();
  state.gameOver = true;
  state.finalFailureKey = failureReason;
  state.activeSummary = { type: "final" };
  renderFinal();
  setHidden(el.eventScreen, true);
  setHidden(el.interludeScreen, true);
  setHidden(el.appealScreen, true);
  setHidden(el.gameScreen, true);
  setHidden(el.startScreen, true);
  setHidden(el.summaryScreen, false);
  clearSave();
}

function renderFinal() {
  const accuracy = Math.round((state.score.correct / Math.max(1, state.score.total)) * 100);
  const failureKey = state.finalFailureKey;
  const ending = getEnding(accuracy);

  el.summaryKicker.textContent = failureKey ? t("final.kicker.failure") : t("final.kicker.success");
  el.summaryTitle.textContent = failureKey ? t("final.title.failure") : ending.title;
  el.summaryBody.textContent = failureKey ? t(`failures.${failureKey}`) : ending.body;
  el.summaryStats.innerHTML = buildSummaryStats(accuracy);
  el.summaryButton.textContent = t("summary.button.restart");
}

function getEnding(accuracy) {
  const { control, backlash, morale, safety, yield: adYield } = state.metrics;
  const gain = state.finance.gain;
  const runway = state.metrics.runway;
  const exodus = state.metrics.exodus;
  const architecture = dominantArchitecture();

  if (architecture.type === "facade" && (hasEdict("humanFacade") || architecture.scores.facade >= 5)) {
    return {
      title: t("ending.facade.title"),
      body: t("ending.facade.body", { gain: formatMoney(gain), exodus }),
    };
  }

  if (hasEdict("computePurge") && runway >= 70 && exodus >= 45) {
    return {
      title: t("ending.purge.title"),
      body: t("ending.purge.body", { gain: formatMoney(gain), runway, exodus }),
    };
  }

  if (architecture.type === "hybrid" && accuracy >= 72 && morale >= 45 && backlash <= 62) {
    return {
      title: t("ending.hybrid.title"),
      body: t("ending.hybrid.body", { gain: formatMoney(gain), runway }),
    };
  }

  if (architecture.type === "sovereignty" && (hasEdict("machineQuorum") || control >= 75) && runway >= 55) {
    return {
      title: t("ending.sovereignty.title"),
      body: t("ending.sovereignty.body", { gain: formatMoney(gain), runway, exodus }),
    };
  }

  if (runway >= 80 && exodus >= 60) {
    return {
      title: t("ending.leadingModel.title"),
      body: t("ending.leadingModel.body", { gain: formatMoney(gain) }),
    };
  }

  if (gain >= 450000 && backlash <= 70 && exodus < 75) {
    return {
      title: t("ending.treasury.title"),
      body: t("ending.treasury.body", { gain: formatMoney(gain) }),
    };
  }

  if (adYield >= 70 && backlash >= 60) {
    return {
      title: t("ending.fire.title"),
      body: t("ending.fire.body"),
    };
  }

  return {
    title: t("ending.grey.title"),
    body: t("ending.grey.body", { gain: formatMoney(gain) }),
  };
}

function startNewGame() {
  stopTimer();
  state = initialState();
  state.started = true;
  saveState();
  showGame();
}

function resetGame() {
  stopTimer();
  clearSave();
  state = initialState();
  showStart();
}

function toggleMute() {
  state.muted = !state.muted;
  renderUtilityButtons();
  saveState();
}

function playTone(frequency, duration) {
  if (state.muted) return;
  try {
    audioContext ??= new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    state.muted = true;
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = locale;
  document.title = t("meta.title");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
  el.languageSelects.forEach((select) => {
    select.value = locale;
    select.setAttribute("aria-label", t("language.aria"));
  });
  renderUtilityButtons();
}

function renderUtilityButtons() {
  el.muteButton.textContent = state.muted ? t("sound.off") : t("sound.on");
  el.resetButton.textContent = t("reset.short");
}

function refreshLocalizedText() {
  applyStaticTranslations();
  if (!el.gameScreen.hidden) render();
  if (!el.eventScreen.hidden) showEvent(currentDay().event);
  if (!el.interludeScreen.hidden) renderInterlude();
  if (!el.appealScreen.hidden) renderAppeal();
  if (!el.summaryScreen.hidden) {
    if (state.gameOver) {
      renderFinal();
    } else if (state.activeSummary?.type === "day") {
      renderDaySummary();
    }
  }
}

function setLocale(nextLocale) {
  const normalized = normalizeLocale(nextLocale);
  if (normalized === locale) return;
  locale = normalized;
  saveLocale();
  refreshLocalizedText();
  saveState();
}

function bindEvents() {
  el.startButton.addEventListener("click", startNewGame);
  el.continueButton.addEventListener("click", showGame);
  el.nextButton.addEventListener("click", nextCase);
  el.summaryButton.addEventListener("click", () => {
    if (state.gameOver) {
      resetGame();
      return;
    }
    continueAfterSummary();
  });
  el.resetButton.addEventListener("click", resetGame);
  el.muteButton.addEventListener("click", toggleMute);
  el.actionButtons.forEach((button) => {
    button.addEventListener("click", () => decide(button.dataset.action));
  });
  el.appealButtons.forEach((button) => {
    button.addEventListener("click", () => resolveAppeal(button.dataset.appeal));
  });
  el.languageSelects.forEach((select) => {
    select.addEventListener("change", () => setLocale(select.value));
  });
  window.addEventListener("keydown", (event) => {
    if (el.gameScreen.hidden || state.decided) return;
    const map = {
      "1": "monetize",
      "2": "limited",
      "3": "demonetize",
      "4": "escalate",
    };
    if (map[event.key]) decide(map[event.key]);
  });
}

bindEvents();
applyStaticTranslations();

if (state.started && !state.gameOver) {
  showGame();
  if (state.interludes.active !== null) {
    showInterlude(state.interludes.active);
  } else if (state.appeals.active) {
    const entry = findCaseById(state.appeals.active.caseId);
    if (entry) {
      renderAppeal(entry, state.appeals.active);
      setSprite(el.appealImage, entry.caseNumber, 5, 4);
      setHidden(el.eventScreen, true);
      setHidden(el.interludeScreen, true);
      setHidden(el.summaryScreen, true);
      setHidden(el.appealScreen, false);
      stopTimer();
    }
  }
} else {
  showStart();
}
