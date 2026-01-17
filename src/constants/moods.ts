export interface Mood {
    id: string;
    emoji: string;
    label: string;
    content: {
        source: string; // Ayet, Hadis, Dua
        text: string;
        reference: string; // Sure/Ayet No vb.
    }[];
}

export const MOODS: Mood[] = [
    {
        id: "uzgun",
        emoji: "😔",
        label: "Üzgün",
        content: [
            {
                source: "Ayet",
                text: "Kalpler ancak Allah'ı anmakla huzur bulur.",
                reference: "Ra'd Suresi, 28",
            },
            {
                source: "Ayet",
                text: "La tahzen! (Üzülme!) Allah bizimle beraberdir.",
                reference: "Tevbe Suresi, 40",
            },
            {
                source: "Hadis",
                text: "Müminin durumu ne hoştur! Her hali kendisi için hayırlıdır.",
                reference: "Müslim, Zühd 64",
            },
        ],
    },
    {
        id: "mutlu",
        emoji: "😃",
        label: "Mutlu",
        content: [
            {
                source: "Ayet",
                text: "Eğer şükrederseniz, elbette size (nimetimi) artırırım.",
                reference: "İbrahim Suresi, 7",
            },
            {
                source: "Dua",
                text: "Allah'ım! Verdiğin nimetlere hamdolsun.",
                reference: "",
            },
        ],
    },
    {
        id: "yorgun",
        emoji: "😴",
        label: "Yorgun",
        content: [
            {
                source: "Ayet",
                text: "Şüphesiz güçlükle beraber bir kolaylık vardır.",
                reference: "İnşirah Suresi, 5",
            },
            {
                source: "Dua",
                text: "Allah'ım! Güç ve kuvvet ancak seninledir.",
                reference: "",
            },
        ],
    },
    {
        id: "hendiseli",
        emoji: "😟",
        label: "Endişeli",
        content: [
            {
                source: "Ayet",
                text: "De ki: Allah'ın bizim için yazdığından başkası bize asla erişmez.",
                reference: "Tevbe Suresi, 51",
            },
            {
                source: "Ayet",
                text: "Allah bize yeter, O ne güzel vekildir.",
                reference: "Al-i İmran, 173",
            },
        ],
    },
    {
        id: "sukur",
        emoji: "🤲",
        label: "Şükürlü",
        content: [
            {
                source: "Ayet",
                text: "Rabbinizin nimetlerinden hangisini yalanlayabilirsiniz?",
                reference: "Rahman Suresi",
            },
        ],
    },
    {
        id: "tovbe",
        emoji: "😢",
        label: "Pişman",
        content: [
            {
                source: "Ayet",
                text: "Allah, tövbe edenleri ve temizlenenleri sever.",
                reference: "Bakara Suresi, 222",
            },
            {
                source: "Hadis",
                text: "Günahından tövbe eden, hiç günah işlememiş gibidir.",
                reference: "İbn Mâce, Zühd 30",
            },
        ],
    },
];
