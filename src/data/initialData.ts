import { Memory, EventSettings } from '../types';

export const initialEventSettings: EventSettings = {
  eventName: "Mis 15 Valentina",
  honoreeName: "Valentina Méndez",
  celebrationType: "Mis 15 Años",
  date: "2025-10-14",
  location: "Salón Crystal Palace",
  hashtag: "#Mis15Valen",
  coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAowa0QMnNmb_1oTuH7ZOk8q6iAM-lTcaSNdpAnbnq7kYzUgmA8fOOEsAEOFARvnQaibJg0qXzwbmre302mdeKRiSs3Ti4g91q7TsWSkKY3oy7iflNQamMV80IVpgubltRGIMjyPLA6DWl_JFQi5sf92FQuXDamwSPta2LaldeW8KXkpxtPIoChcgwncDh9qZK9FrKnvVOMThrU-xHmGPB6LKCOlanqU-dtngxmWi2MHOWpg2loatUJ_A",
  welcomeMessage: "¡Bienvenidos a mi noche mágica! Gracias por acompañarme en este sueño. Tomen todas las fotos que deseen y compartan cada momento en vivo con nosotros.",
  driveAccount: "carlosvargasotorgues@gmail.com",
  driveFolder: "Drive / Mis 15 Valentina Méndez / Fotos en Vivo",
  driveFolderId: "1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt",
  driveDirectFolderUrl: "https://drive.google.com/drive/folders/1bHI5-NkaB7LBEeTD_wOZ-_nfcuTOLYrt",
  driveWebhookUrl: "https://script.google.com/macros/s/AKfycbxqZd-UHTwp9b80Sr-rz90LJx8Tjte_w_UpqFdt1OHYYO6TZoktfv2TyKgOm-siCN9pCA/exec",
  strictDeletePermission: true,
  moderationEnabled: false,
  eventSlug: "valen-mendez-2025",
  adminUser: "uriel",
  adminPassword: "94909766",
};

export const initialMemories: Memory[] = [
  {
    id: "mem-1",
    author: "Tía Carmen",
    table: "Mesa 2 • Familiares",
    time: "Hace 4 min",
    timestamp: Date.now() - 4 * 60 * 1000,
    message: "¡Qué emoción verte brillar tanto! Eres la reina de la noche.",
    reaction: "💙",
    likes: 46,
    isLiked: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4IZVEli2OfVypCM3_5C7a2kD6e1tF7JeyoS4g0xHpOeSsmJ6dwk5zWimXnAuG93dcoAI-Lc42it1Enb4keJanS_7Nf-hMUilCQgNzGsu8mVnmw-AK7X0mrmBUQ8-hFt5kUXF62TU-br38TLxVDUpzBOyd8qWn4tj-eU2ThG8-eRts-IHsSbevUc7grRLUU2YtA41-iK2QYiFk0URuGB0Eo4f2cCRhWht34ryxO2ZSFURx1xVT34yuPg",
    momentTag: "Momento: El Gran Vals",
    driveSynced: true,
    verified: true,
  },
  {
    id: "mem-2",
    author: "Grupo Amigas del Cole",
    table: "Pista de baile",
    time: "Hace 8 min",
    timestamp: Date.now() - 8 * 60 * 1000,
    message: "¡La pista está encendida! Disfrutando cada tema con la quinceañera más hermosa 🎉",
    reaction: "👑",
    likes: 39,
    isLiked: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQWnWJ4F7j1ZTWahA0yevgGA_m7ct14J4ztB4aA4ekgh6kbSOKmp5EOTTH2GsahGgR72dQPDq1xHURRwJeD6NbHmTEV-P-vLKY10G6Y6i3TCwpakvtMsTJzoYSg3_lk4lyrohgwlLGq_UaS3tLnA3jhN0aXuSM5Gpf1LHIHQk__mLsOQV19MQcPONYhxbaBAF6eYAaYWpxeEOEcj51Rz0gFh7vehFzZVQB9I5TH4mcHlkLTOBvJMfwNQ",
    momentTag: "Cotillón & DJ Set",
    driveSynced: true,
    verified: false,
  },
  {
    id: "mem-3",
    author: "Familia Morales",
    table: "Salón Principal",
    time: "Hace 12 min",
    timestamp: Date.now() - 12 * 60 * 1000,
    message: "Un brindis por tu felicidad, salud y un futuro lleno de bendiciones. ¡Salud!",
    reaction: "🥂",
    likes: 28,
    isLiked: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbNE7T2ax1hnAsofaLy6sePwQYB5UZ0YiGtlV5XiS1LwMtyIdwlFFEzBDBAl4kVI0EJF7pf9SGtaQXWYyMXi0cTGiTPS4prHojYwEh25sTPAHCV23XNn1oNjCDkgwrDAwvDxAg9DNa2dwvwOV5UunyNHQF_oxZgLWhnAmUYIvrhm3aueVvnLHrKEVNpdquXs8-OH7noPojHXSRmW9iV1Ukr3YrksTzdA70KxQSOsEeCH3o2_r1NyUYtQ",
    momentTag: "Brindis de Gala",
    driveSynced: true,
    verified: false,
  },
  {
    id: "mem-4",
    author: "Sofía y Lucas",
    table: "Mesa 3",
    time: "Hace 16 min",
    timestamp: Date.now() - 16 * 60 * 1000,
    message: "¡Valen, estás hermosa! Que disfrutes al máximo esta noche inolvidable. Te queremos mucho 🎉💙",
    reaction: "✨",
    likes: 33,
    isLiked: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJA93DZkuzzRE-uvzVFpwtWZZDQol4a98cbGs4SiSp6W_biG1DnPXUYJrFw3uymd2oknL86Kvq3g3ALngU8KWfN2kZfEIZoJJ5M5uvxR70GwsoQm_2DLksPzxJxLOtoGlgra_hlklNy5SjTHU-LsVM47lw7HDekxkt6DFxKNaRYEiocbVAemxyI9Z2zM8cYIoBQ2B1b86LxC0oEIcsFWyZx_3xOySAvo_sithY6GkUXKhLtCfyMu-UsQ",
    momentTag: "Amigos de Fiesta",
    driveSynced: true,
    verified: true,
  },
  {
    id: "mem-5",
    author: "Corte de Honor",
    table: "Mesa VIP",
    time: "Hace 22 min",
    timestamp: Date.now() - 22 * 60 * 1000,
    message: "¡Orgullosos de ser parte de tu noche de ensueño!",
    reaction: "👑",
    likes: 54,
    isLiked: false,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBf-C1DyXGvNhMA7bLkQbkdS6CovDPFLV2xncBoM2Rs-pMzFWORUOULQt7NtM20qivusduLvQpvY_EoWGhJWE1bufAm8oT5K7nmwt1UPhymF4ljzh9N9R3ewc2OUlKy7JMlb918UWf20xmtSJPLIZqscqsRaPdGzNhvGxJdcGn_9zDm5o7JW0fTM5b2A-xlN44kkSEaxJEtFi6mtpxHwPd-wRyqcrdw3HbVeTi7USJJEXZKXEtL6Zhhxg",
    momentTag: "Corte de Damas y Caballeros",
    driveSynced: true,
    verified: true,
  }
];

export const carouselGallery = [
  {
    title: "Ahora",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuChpheszDyUGMol4sxlUD_NOZoMDbkMB3k-MjV9ZG8vHHsKIYLV9jvV8lBpvL6egMNYSnJNLBWIMudvjJcm8-0CD41afl5ZEHw45VhA5SwY7SBjavk_SGanXXw32iodnvRe8dJAYloCKGgx_gxxpmFuOgzQUPzVFu1OkmCpWOuTUIN30YBvYFZH7kCIEbyknhr1AlXC2iCO9oemQIjlRpQI3SVGdX6ZC6837WJ8INz83A3baBrUasNauw"
  },
  {
    title: "Mesa 5",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCd5NBEj8U99S7HXeldtYDhpcx5ZjJ4XpLv7vseB9XfKuV65XJEWIqTuWN2ZxJ6wRLyWmmFK5u7HJgfgNc9yHfx75GJARDRBiPS1mWIFvR7WN-M9N6J4sMqGwPIOLtrt_jQWaj04MAApi8Vmw9_VH5DInsMJ-1-5R2JXYvQr9jOVhheaKsaxF05xebYyKLL4oRQOm16yPgqyOP_8fI4061BYt3Tl_HCXPa1yxn0OaeX-LBXHQkWoXscZQ"
  },
  {
    title: "Amigos Promo",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSJKx6iceX1LO8YA4FyI-sjtyBKuyyNXNcK4AuNBQM5pS9KisenXdi-8QWZXPr8acMfsx2W9IVP9rcoI12hQfnsDd53ZCdKqLWQ7KXP9GjWKAyyc-ZqZ4Je7gFyGoBSjZc79o2SCfziKcB7C76OEAV_w3OXUTHhtWV96ZT-QCJM3-h6vASfVOXBUckmTx7qc3iv0W2Y7Icwwm_DCV2HMGgBE6eTHq52lO6lJLgltbfTkPX8PSaJ2nxYQ"
  },
  {
    title: "Mesa Dulce",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6O7EvOPZrarhT6NxILlPdvjwtemOqUS3GeNTUf5v25H-yO1gEVWlu8C5aKTqYkwld4ksftHYc28Dh3LheIAH8W1QgZ_t-q8YW6ZYq_HDKLQircagi-HPsNRegUJKsGV4HfOfIS2chbMzsnXM8ZGAzep3xBMjFuprJf77TNGUeVGF3MMAItq4Sp66OX6o24Q6zKsJNHOhTtpXC7DC2b5mur-XctfWBOrbmRORfrBwGK6v0O7BPhelWgg"
  }
];
