import create from 'zustand'

const [useStore] = create(set => ({
    annotations: [],
    fromTo: [],

    glucoseFeed: latestGlucoseFeed,
    observed: [],
    predicted: [],
    
    eventsText: "",

    // Body metabolism model.
    insulinSensitivity: -1.8,
    carbSensitivity: 0.27,

    // Insulin pump settings model.
    bolusText: "",
    basalText: "",
    correctionText: "",

    stats: {
        totalInsulin: 0,
        totalCarbs: 0,
        startBG: 0,
        endBG: 0,
        deltaBG: 0,
        events: []
    },

    // Experiments.
    experiments: [],

    
}))