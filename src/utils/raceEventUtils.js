// raceEventUtils.js
// Utilitário para controlar horários de eventos de corrida
const EVENT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos (para teste)
const EVENT_START_OFFSET = 0; // pode ser ajustado para alinhar o horário do primeiro evento

export function getNextRaceEventTime(now = Date.now()) {
    // Calcula o timestamp do próximo evento baseado no início do dia
    const today = new Date(now);
    today.setMinutes(0, 0, 0);
    const startOfDay = today.setHours(0, 0, 0, 0);
    const msSinceStart = now - startOfDay;
    const eventsPassed = Math.floor(msSinceStart / EVENT_INTERVAL_MS);
    const nextEvent = startOfDay + (eventsPassed + 1) * EVENT_INTERVAL_MS + EVENT_START_OFFSET;
    return nextEvent;
}

export function isRaceEventNow(now = Date.now()) {
    // Retorna true se estamos dentro da janela de evento (ex: 10min após o início)
    const today = new Date(now);
    today.setMinutes(0, 0, 0);
    const startOfDay = today.setHours(0, 0, 0, 0);
    const msSinceStart = now - startOfDay;
    const eventsPassed = Math.floor(msSinceStart / EVENT_INTERVAL_MS);
    const lastEvent = startOfDay + eventsPassed * EVENT_INTERVAL_MS + EVENT_START_OFFSET;
    // Janela de 10 minutos para iniciar a corrida
    return now >= lastEvent && now < lastEvent + 10 * 60 * 1000;
}

export function getNextRaceEventDate(now = Date.now()) {
    return new Date(getNextRaceEventTime(now));
}
