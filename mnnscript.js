// ====================================================================
// mnnscript.js - KORRIGIERTE & BEREINIGTE GESAMT-VERSION (V2.0.10)
// Beinhaltet alle Fixes: API-Key, switchView, Cache-Handling und Splash-Logik
// ====================================================================

// --- 1. KONFIGURATION ---
const API_KEY = 'AIzaSyDXtPSF4EuneOi_l3vCAKEtRHjD1gIiMBg'; // Ihr neuer, eingeschränkter Schlüssel
const CALENDAR_ID = 'miteinander.netzwerk.nordleda@gmail.com';
const MIN_SPLASH_DURATION = 1500; // Mindestdauer des Splash-Screens in ms

// Pfadpräfix für GitHub Pages (WICHTIG für alle statischen Assets)
const BASE_PATH = '/mnn-event-app/'; 

// NEUE KONSTANTEN FÜR ALLE FEIERTAGS-LOGOS
const DEFAULT_LOGO_PATH = BASE_PATH + 'Splashlogo.png'; 
const ADVENT_LOGO_BASE = BASE_PATH + 'mnnsplashadv'; 
const LOGO_EXTENSION = '.jpg'; 

const CHRISTMAS_LOGO = BASE_PATH + 'mnnsplashtannen' + LOGO_EXTENSION;
const NEW_YEARS_LOGO = BASE_PATH + 'mnnsplashfeuerwerk' + LOGO_EXTENSION;
const VALENTINE_LOGO = BASE_PATH + 'mnnsplashvalentins' + LOGO_EXTENSION;
const EASTER_LOGO = BASE_PATH + 'mnnsplashostern' + LOGO_EXTENSION;
const UNITY_DAY_LOGO = BASE_PATH + 'mnnsplashdeutsch' + LOGO_EXTENSION; 


// Basisdaten für die Anbieter (als Map für schnellen Zugriff)
const providersData = [
    { id: 1, name: "TSV Nordleda", contact: "Jürgen Hoberg Tel. 04758-546", info: "Der lokale Sportverein mit verschiedenen Angeboten", link: "https://www.nordleda.de/vereine-und-choere/tsv-nordleda-ev/", color: "#a4bdfc" },
    { id: 2, name: "DRK Nordleda", contact: "Anja von Bebern Tel. 04758-679", info: "Der DRK Ortsverein bietet mit dem Arbeitskreis viele verschiedene Veranstaltungen", link: null, color: "#ff887c" },
    { id: 3, name: "Schützenverein Nordleda", contact: "Über das Kontaktformular auf der Webseite", info: "Schützenverein Nordleda von 1953 e.V.", link: "https://www.svnordleda.de/", color: "#7ae7bf" },
    { id: 4, name: "Kirchengemeinde Nordleda", contact: "meike.mueller-bilgenroth@evlka.de", info: "Die Kirchengemeinde St. Nicolai in Nordleda", link: "https://www.kk-ch.de/gemeinden/nordleda/", color: "#dbadff" },
    { id: 5, name: "taktlos-Chor", contact: "Über das Kontaktformular auf der Webseite", info: "...der a cappella Männerchor", link: "https://www.gruppe-taktlos.de/", color: "#5484ed" },
    { id: 6, name: "LoGos-Chor Nordleda", contact: "Gunda Knust Tel. 04758-326", info: "Lobpreis-Gospelchor", link: null, color: "#8A2BE2" },
    { id: 7, name: "FamilienHaven Nordleda", contact: "Serina Naß Tel. 015256302291", info: "Delfi Kurse - Fachkraft für Beikost, Elternvorbereitung, Säuglingspflege, Achtsamkeit", link: "https://www.instagram.com/delfinordleda/", color: "#fbd75b" },
    { id: 8, name: "Werbegemeinschaft Nordleda", contact: "Hans-Hermann Ropers Tel. 04758-444", info: "Werbegemeinschaft des Ortes Nordleda", link: null, color: "#ffacac" },
    { id: 9, name: "CDU Nordleda", contact: "Hans-Hermann Ropers Tel. 04758-444", info: "CDU Ortsverband Nordleda", link: "https://www.cdu-land-hadeln.de/ortsverbaende/nordleda/", color: "#000000" },
    { id: 10, name: "SoVD Neuenkirchen/Nordleda", contact: "Über das Kontaktformular auf der Webseite", info: "Sozialverband Deutschland", link: "https://www.sovd-cuxhaven.de/verband-990125?verbandid=991896&cHash=f253ff976383e4a74d925e676582cb7b", color: "#D3D3D3" },
    { id: 11, name: "Miteinander Netzwerk Nordleda", contact: "miteinander.netzwerk.nordleda@gmail.com", info: "Interessengruppe zur Stärkung des Gemeinschaftsgefüges", link: "https://sites.google.com/view/netzwerknordleda/start", color: "#EE00EE" },
    { id: 12, name: "Feuerwehr Nordleda", contact: "info@feuerwehr-nordleda.de", info: "Freiwillige Feuerwehr und Jugendfeuerwehr Nordleda", link: "https://www.instagram.com/ffw_nordleda/?hl=de", color: "#FF0000" },
    { id: 99, name: "Freier Anbieter", contact: "Evtl. über die Veranstaltungsbeschreibung", info: "verschiedene Anbieter von Veranstaltungen", link: null, color: "#F8F8FF" }
];
const providers = new Map(providersData.map(p => [p.id, p]));

// --- DOM-ELEMENTE ---
const contentDiv = document.getElementById('app-content');
const headerTitle = document.getElementById('headerTitle');
const searchInput = document.getElementById('searchInput');
const eventModal = document.getElementById('eventModal');
const veranstalterModal = document.getElementById('veranstalterModal');
const appLoader = document.getElementById('app-loader');
const splashScreen = document.getElementById('splashScreen');
const filterContainer = document.getElementById('filter-container'); 
const searchContainer = document.getElementById('search-container'); 
const whatsappView = document.getElementById('whatsapp-view');
const contactView = document.getElementById('contact-view');

// --- GLOBALE VARIABLEN ---
let dynamicEvents = []; // Events von Google (Online-Abruf)
let currentFilterId = null; 
let startTime; 
window.eventDetailsCache = null; 
let lastKnownEvents = []; // Events aus dem Cache (Offline-Modus)


// --- 2. HILFSFUNKTIONEN (FEIERTAGS-LOGIK, CLEANING, ETC.) ---

function extractProviderId(titleString) {
    if (!titleString) return null;
    const match = titleString.trim().match(/(?:\[|\[ID:\s*|\(ID:\s*)(\d+)(?:\]|\)\s*)/i); 
    return match ? parseInt(match[1]) : null;
}

function cleanTitle(titleString) {
    if (!titleString) return 'Unbekanntes Event';
    return titleString.replace(/\s*(?:\[|\[ID:\s*|\(ID:\s*)\d+(?:\]|\)\s*)/i, '').trim();
}

function getEmbeddableDriveLink(description) {
    if (!description) return null;
    const fileIdRegex = /(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/;
    const match = description.match(fileIdRegex);
    
    if (match && match[1]) {
        const fileId = match[1].trim();
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
    }
    return null;
}

// --- FEIERTAGS-LOGIK FUNKTIONEN ---

function getFirstAdventDate(year) {
    const nov30 = new Date(year, 10, 30); 
    const dayOfWeek = nov30.getDay(); 
    let date = 30 - dayOfWeek;
    if (date < 27) {
        date = 30 + (7 - dayOfWeek);
    }
    const firstAdvent = new Date(year, 10, date);
    firstAdvent.setHours(0, 0, 0, 0);
    return firstAdvent;
}

function getEasterDate(year) {
    // Gauss'sche Osterformel
    const a = year % 19;
    const b = year % 4;
    const c = year % 7;
    const k = Math.floor(year / 100);
    const p = Math.floor(k / 3);
    const q = Math.floor(k / 4);
    const M = Math.floor((15 + k - p - q) % 30);
    const N = Math.floor((4 + k - q) % 7);
    const d = Math.floor((19 * a + M) % 30);
    const e = Math.floor((2 * b + 4 * c + 6 * d + N) % 7);
    let day = 22 + d + e;
    let month = 3; 
    
    if (day > 31) {
        month = 4;
        day = day - 31;
    }
    
    if (d === 29 && e === 6 && year >= 1900) {
        day = 19;
        month = 4;
    }
    if (d === 28 && e === 6 && a > 10 && year >= 1900) {
        day = 18;
        month = 4;
    }
    
    const easter = new Date(year, month - 1, day);
    easter.setHours(0, 0, 0, 0);
    return easter;
}


function getSplashLogoPath() {
    const checkDateRange = (now, monthStart, dayStart, monthEnd, dayEnd) => {
        const year = now.getFullYear();
        const start = new Date(year, monthStart, dayStart);
        const end = new Date(year, monthEnd, dayEnd);
        end.setHours(23, 59, 59, 999);
        return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
    };
    
    const now = new Date();
    const year = now.getFullYear();
    
    // 1. Fixe Feiertage
    if (checkDateRange(now, 0, 1, 0, 1)) {
        return { path: NEW_YEARS_LOGO, text: "Frohes neues Jahr!" };
    }
    if (checkDateRange(now, 1, 14, 1, 14)) {
        return { path: VALENTINE_LOGO, text: "Alles Liebe zum Valentinstag!" };
    }
    if (checkDateRange(now, 9, 3, 9, 3)) {
        return { path: UNITY_DAY_LOGO, text: "Herzliche Grüße zum Tag der Deutschen Einheit!" };
    }
    
    // 2. Bewegliche Feiertage (Ostern)
    const easterSunday = getEasterDate(year);
    const goodFriday = new Date(easterSunday);
    goodFriday.setDate(easterSunday.getDate() - 2);
    const easterMonday = new Date(easterSunday);
    easterMonday.setDate(easterSunday.getDate() + 1);
    
    if (now.getTime() >= goodFriday.getTime() && now.getTime() <= easterMonday.getTime()) {
        return { path: EASTER_LOGO, text: "Frohe Ostern!" };
    }

    // 3. Silvester
    if (checkDateRange(now, 11, 31, 11, 31)) {
        return { path: NEW_YEARS_LOGO, text: "Guten Rutsch!" };
    }
    
    // 4. Weihnachten
    if (checkDateRange(now, 11, 24, 11, 26)) {
        return { path: CHRISTMAS_LOGO, text: "Frohe Weihnachten!" };
    }
    
    // 5. Adventszeit
    const firstAdvent = getFirstAdventDate(year);
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const christmasEveStart = new Date(year, 11, 24);
    christmasEveStart.setHours(0, 0, 0, 0);
    
    if (now.getTime() >= firstAdvent.getTime() && now.getTime() < christmasEveStart.getTime()) {
        const diffTime = now.getTime() - firstAdvent.getTime();
        const diffDays = Math.floor(diffTime / MS_PER_DAY);
        let logoIndex = Math.floor(diffDays / 7) + 1;
        
        if (logoIndex > 4) {
             logoIndex = 4;
        }

        const weekNumber = logoIndex;
        return { path: ADVENT_LOGO_BASE + logoIndex + LOGO_EXTENSION, text: `Frohe ${weekNumber}. Adventswoche!` };
    }

    // 6. Standard-Logo
    return { path: DEFAULT_LOGO_PATH, text: "Lade Events..." };
}

// --- KALENDER EXPORT FUNKTIONEN ---

function formatToCalendarDateString(dateObject, isAllDay) {
    const year = dateObject.getFullYear();
    const month = ('0' + (dateObject.getMonth() + 1)).slice(-2);
    const day = ('0' + dateObject.getDate()).slice(-2);

    if (isAllDay) {
        return `${year}${month}${day}`;
    } else {
        const hour = ('0' + dateObject.getHours()).slice(-2);
        const minute = ('0' + dateObject.getMinutes()).slice(-2);
        return `${year}${month}${day}T${hour}${minute}00`;
    }
}


function getGoogleCalendarUrl(event) {
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description.replace(/\n/g, ' ')); 
    const location = encodeURIComponent(event.location);
    
    let isAllDay = event.endDate === ''; 
    let startMoment = new Date(event.sortDate); 
    let endMoment;

    if (isAllDay) {
        startMoment.setHours(0, 0, 0, 0); 
    } else {
        const timeMatch = event.date.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
            startMoment.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        }
    }
    
    if (isAllDay) {
        endMoment = new Date(startMoment);
        endMoment.setDate(endMoment.getDate() + 1);
    } else {
        endMoment = new Date(startMoment);
        const endTimeMatch = event.endDate.match(/(\d{2}):(\d{2})/);
        if (endTimeMatch) {
            endMoment.setHours(parseInt(endTimeMatch[1]), parseInt(endTimeMatch[2]), 0, 0);
            if(endMoment.getTime() < startMoment.getTime()) {
                endMoment.setDate(endMoment.getDate() + 1);
            }
        } else {
            endMoment.setHours(startMoment.getHours() + 1);
        }
    }

    let startFormatted = formatToCalendarDateString(startMoment, isAllDay);
    let endFormatted = formatToCalendarDateString(endMoment, isAllDay);
    
    const datesParam = `${startFormatted}/${endFormatted}`;

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${description}&location=${location}&sf=true`;
    
    return calendarUrl;
}

function getICSContent(event) {
    const provider = providers.get(event.providerId);
    const organizer = provider ? `ORGANIZER;CN=${provider.name}:mailto:${provider.contact || 'noreply@nordleda.de'}` : '';

    let isAllDay = event.endDate === ''; 
    let startMoment = new Date(event.sortDate); 
    let endMoment;

    if (isAllDay) {
        startMoment.setHours(0, 0, 0, 0); 
        endMoment = new Date(startMoment);
        endMoment.setDate(endMoment.getDate() + 1);
    } else {
        const timeMatch = event.date.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
            startMoment.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        }
        endMoment = new Date(startMoment);
        const endTimeMatch = event.endDate.match(/(\d{2}):(\d{2})/);
        if (endTimeMatch) {
            endMoment.setHours(parseInt(endTimeMatch[1]), parseInt(endTimeMatch[2]), 0, 0);
            if(endMoment.getTime() < startMoment.getTime()) {
                endMoment.setDate(endMoment.getDate() + 1);
            }
        } else {
            endMoment.setHours(startMoment.getHours() + 1);
        }
    }
    
    const icsFormatDate = (date) => {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}${month}${day}`;
    };
    
    const icsFormatTime = (date) => {
        const hour = ('0' + date.getHours()).slice(-2);
        const minute = ('0' + date.getMinutes()).slice(-2);
        const second = ('0' + date.getSeconds()).slice(-2);
        return `T${hour}${minute}${second}`;
    }
    
    let icsStartLine;
    let icsEndLine;
    
    if (isAllDay) {
        icsStartLine = `DTSTART;VALUE=DATE:${icsFormatDate(startMoment)}`;
        icsEndLine = `DTEND;VALUE=DATE:${icsFormatDate(endMoment)}`;
    } else {
        icsStartLine = `DTSTART:${icsFormatDate(startMoment)}${icsFormatTime(startMoment)}`;
        icsEndLine = `DTEND:${icsFormatDate(endMoment)}${icsFormatTime(endMoment)}`; 
    }

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MiteinanderNetzwerkNordleda//EventApp//DE',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${event.id}-${Date.now()}@nordleda.de`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15)}Z`,
        icsStartLine,
        icsEndLine,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`,
        `LOCATION:${event.location.replace(/,/g, '\\,')}`,
        organizer,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    return icsContent;
}

function downloadICS(event) {
    if (!event) return; 
    
    const icsContent = getICSContent(event);
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.ics`); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 3. DATENABRUF VON GOOGLE KALENDER ---

function fetchCalendarEvents() {
    startTime = Date.now(); 
    
    if (lastKnownEvents.length > 0) {
        applyCategoryFilter(currentFilterId);
    }
    
    const hideSplash = () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_SPLASH_DURATION - elapsedTime;

        if (remainingTime > 0) {
            setTimeout(() => {
                splashScreen.classList.add('fade-out');
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                }, 1000); 
            }, remainingTime);
        } else {
             splashScreen.classList.add('fade-out');
             setTimeout(() => {
                 splashScreen.style.display = 'none';
             }, 1000); 
        }
    };

    headerTitle.textContent = "Veranstaltungen";
    if (lastKnownEvents.length === 0) {
        contentDiv.innerHTML = '';
    }

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
    const timeMaxParam = threeMonthsFromNow.toISOString();

    // KORREKT: API_KEY und CALENDAR_ID werden aus den Konstanten verwendet
    const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${(new Date()).toISOString()}&timeMax=${timeMaxParam}&singleEvents=true&orderBy=startTime`;

    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}.`);
            }
            return response.json();
        })
        .then(data => {
            dynamicEvents = data.items.map((item, index) => {
                
                const rawTitle = item.summary || '';
                const providerId = extractProviderId(rawTitle);
                
                const isTimedEvent = !!item.start.dateTime;
                const eventStart = new Date(item.start.dateTime || item.start.date);
                
                let startDate;
                let endDate = '';

                if (isTimedEvent) {
                    startDate = eventStart.toLocaleDateString('de-DE', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }).replace(':', ':').trim();
                    
                    const eventEnd = new Date(item.end.dateTime);
                    endDate = eventEnd.toLocaleTimeString('de-DE', {
                        hour: '2-digit', minute: '2-digit'
                    }).trim() + ' Uhr';


                } else {
                    const tempDate = new Date(item.start.date);
                    startDate = tempDate.toLocaleDateString('de-DE', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    }).trim();
                }

                const dayOfMonth = eventStart.getDate();
                const dayOfWeekShort = eventStart.toLocaleDateString('de-DE', {
                    weekday: 'short'
                }).slice(0, 2);
                
                const sortDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());


                return {
                    id: index,
                    title: cleanTitle(rawTitle),
                    date: startDate,
                    endDate: endDate,
                    dayOfMonth: dayOfMonth,
                    dayOfWeekShort: dayOfWeekShort,
                    location: item.location || 'Keine Angabe',
                    description: item.description || 'Keine weitere Beschreibung vorhanden.',
                    providerId: providerId,
                    sortDate: sortDate 
                };
            }).filter(event => event.title.toLowerCase().indexOf('blockiert') === -1); 
            
            lastKnownEvents = dynamicEvents; 
            appLoader.style.display = 'none';
            
            createFilterButtons(); 
            filterContainer.style.display = 'block';
            applyCategoryFilter(null);
            
            hideSplash(); 
        })	
    .catch(error => {
            appLoader.style.display = 'none';
            hideSplash(); 
            
            if (lastKnownEvents.length > 0) {
                 console.log("Offline-Modus: Zeige letzte bekannte Events.");
                 headerTitle.textContent = "Veranstaltungen (Offline)";
                 
                 applyCategoryFilter(null); 
                 filterContainer.style.display = 'block';

            } else {
                headerTitle.textContent = "Veranstaltungen";
                contentDiv.innerHTML = `<p style="margin: 20px; color: red;">Konnte Events nicht laden: Du bist offline oder der Server ist nicht erreichbar.</p>`;
                console.error("Error fetching events:", error);
                
                filterContainer.style.display = 'none';
            }
        });
}

// --- 4. FUNKTIONEN ZUM RENDERN DER LISTEN (MIT MONATSTRENNUNG) ---
function renderEventList(eventsToRender = dynamicEvents) {
    headerTitle.textContent = "Veranstaltungen";
    contentDiv.innerHTML = '';
    
    eventsToRender.sort((a, b) => a.sortDate - b.sortDate);

    if (eventsToRender.length === 0) {
        contentDiv.innerHTML = `<p style="margin: 20px;">Keine zukünftigen Veranstaltungen gefunden.</p>`;
        return;
    }
    
    let currentMonth = null;
    const dateFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

    eventsToRender.forEach(event => {
        const provider = providers.get(event.providerId);
        const providerName = provider ? provider.name : "Unbekannter Anbieter";
        const cardColor = provider ? provider.color : '#aaaaaa';
        
        const monthAndYear = dateFormatter.format(event.sortDate);
        
        if (monthAndYear !== currentMonth) {
            currentMonth = monthAndYear;
            const separator = document.createElement('div');
            separator.className = 'month-separator';
            separator.textContent = currentMonth;
            contentDiv.appendChild(separator);
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeftColor = cardColor;
        card.style.setProperty('--event-color', cardColor);
        
        card.style.display = 'flex';
        card.style.alignItems = 'flex-start'; 
        
        card.innerHTML = `
            <div class="date-container">
                <div class="date-day-num">${event.dayOfMonth}</div>
                <div class="date-day-short">${event.dayOfWeekShort}</div>
            </div>
            <div class="card-content">
                <h3>${event.title}</h3>
                <p>Datum: ${event.date}</p>
                <p>Anbieter: <strong>${providerName}</strong></p>
            </div>
        `;
        
        card.onclick = () => showEventDetails(event);
        contentDiv.appendChild(card);
    });
}
// --- ENDE FUNKTIONEN ZUM RENDERN DER LISTEN ---

// --- FUNKTIONEN FÜR KATEGORIE-FILTER UND ANBIETER-LISTEN ---

function createFilterButtons() {
    const filterContainer = document.getElementById('filter-container');
    filterContainer.innerHTML = '';
    
    const allBtn = document.createElement('span');
    allBtn.className = 'filter-btn' + (currentFilterId === null ? ' selected' : '');
    allBtn.textContent = 'Alle Events';
    allBtn.onclick = () => {
        searchInput.value = ''; 
        applyCategoryFilter(null);
    };
    filterContainer.appendChild(allBtn);

    providers.forEach(provider => {
        if (provider.id !== 99 && provider.id !== 11) {
            const btn = document.createElement('span');
            btn.className = 'filter-btn' + (currentFilterId === provider.id ? ' selected' : '');
            btn.textContent = provider.name;
            btn.onclick = () => {
                searchInput.value = ''; 
                applyCategoryFilter(provider.id);
            };
            filterContainer.appendChild(btn);
        }
    });
}

function applyCategoryFilter(providerId) {
    currentFilterId = providerId;
    
    // Setzt den "selected" Zustand der Buttons zurück
    document.querySelectorAll('#filter-container .filter-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Markiere den aktuell ausgewählten Button
    if (providerId === null) {
        document.querySelector('#filter-container .filter-btn:first-child').classList.add('selected');
    } else {
        // Sucht den passenden Button anhand des Namens (wegen der Provider-Map)
        const provider = providers.get(providerId);
        if (provider) {
             document.querySelectorAll('#filter-container .filter-btn').forEach(btn => {
                if (btn.textContent === provider.name) {
                    btn.classList.add('selected');
                }
            });
        }
    }


    const sourceData = dynamicEvents.length > 0 ? dynamicEvents : lastKnownEvents;
    let filteredEvents = sourceData;

    if (currentFilterId !== null) {
        filteredEvents = sourceData.filter(event => event.providerId === currentFilterId);
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm)
        );
    }

    renderEventList(filteredEvents); 
}

function renderProviderList(providersToRender = providersData) {
    headerTitle.textContent = "Anbieter";
    contentDiv.innerHTML = '';
    
    // Filterleiste ausblenden (nur für Anbieter-Ansicht)
    filterContainer.style.display = 'none';

    providersToRender.forEach(provider => {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.style.display = 'flex';
        card.style.alignItems = 'flex-start';
        
        const cardColor = provider.color || '#aaaaaa';
        
        card.style.borderLeftColor = cardColor;
        card.style.setProperty('--event-color', cardColor);
        
        card.innerHTML = `
            <div class="date-container" style="visibility: hidden;">
                <div class="date-day-num">00</div>
                <div class="date-day-short">XX</div>
            </div>
            <div class="card-content">
                <h3>${provider.name}</h3>
                <p>Info: ${provider.info}</p>
            </div>
        `;
        card.onclick = () => showVeranstalterDetails(provider.id);
        contentDiv.appendChild(card);
    });
}

function filterEvents() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (document.getElementById('events-btn').classList.contains('active')) {
        
        const eventsToSearch = lastKnownEvents.length > 0 ? lastKnownEvents : dynamicEvents;

        const filteredEvents = eventsToSearch.filter(event => {
            const provider = providers.get(event.providerId);
            const providerName = provider ? provider.name.toLowerCase() : '';
            
            const matchesSearchTerm = event.title.toLowerCase().includes(searchTerm) ||
                                      event.location.toLowerCase().includes(searchTerm) ||
                                      providerName.includes(searchTerm);
                                      
            if (searchTerm.length > 0) {
                // Wenn gesucht wird, ignoriere den Provider-Filter
                return matchesSearchTerm;
            } else {
                // Wenn keine Suche aktiv ist, Filter anwenden
                return currentFilterId === null || event.providerId === currentFilterId;
            }
        });
        
        // Wenn Suchbegriff > 0, alle Filter-Buttons deaktivieren
        if (searchTerm.length > 0) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('selected'));
        } else {
             // Wenn Suche gelöscht wurde, Provider-Filter wieder anwenden
             applyCategoryFilter(currentFilterId);
             return; // Verhindert doppeltes Rendern
        }

        renderEventList(filteredEvents);

    } else if (document.getElementById('providers-btn').classList.contains('active')) {
        const filteredProviders = providersData.filter(provider => {
            return provider.name.toLowerCase().includes(searchTerm) ||
                   provider.info.toLowerCase().includes(searchTerm);
        });
        renderProviderList(filteredProviders);
    }
}

// --- 5. FUNKTIONEN ZUM ANZEIGEN DER DETAILS (MIT KALENDER-LOGIK) ---
function showEventDetails(event) {
    const provider = providers.get(event.providerId);
    const providerName = provider ? provider.name : "Unbekannter Anbieter";
    const providerColor = provider ? provider.color : '#8B4513';
    const safeLinkColor = '#8B4513';

    const imageUrl = getEmbeddableDriveLink(event.description);
    
    let cleanedDescription = event.description;
    
    const fullLinkRegex = /https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)[a-zA-Z0-9_-]+(?:[^ \n\r]*)/g;
    
    if (imageUrl) {
        cleanedDescription = event.description.replace(fullLinkRegex, '').trim();
    }
    
    const imageHtml = imageUrl
        ? `<div class="event-image-container"><img src="${imageUrl}" alt="Event Anhang" class="event-image"></div>`
        : '';

    let timeDisplay;
    if (event.endDate) {
        const startDatePart = event.date.split(',')[0]; 
        const startTimePart = event.date.match(/(\d{2}:\d{2})/)?.[0] || '';
        
        if(startTimePart) {
            timeDisplay = `Am ${startDatePart} von ${startTimePart} bis ${event.endDate}`;
        } else {
            timeDisplay = `${event.date} bis ${event.endDate}`;
        }
    } else {
        timeDisplay = `${event.date} (Ganztägig)`;
    }
        
    const locationEncoded = encodeURIComponent(event.location);
    
    // KORREKTUR: Korrekte Google Maps URL
    const mapsUrl = `https://maps.google.com/?q=${locationEncoded}`; 
    const locationLink = `<a href="${mapsUrl}" target="_blank" style="color: ${safeLinkColor}; font-weight: bold;">${event.location} (Auf Karte anzeigen)</a>`;

    const googleCalendarUrl = getGoogleCalendarUrl(event); 

    const modalContent = document.getElementById('eventModal').querySelector('.modal-content');
    
    Array.from(modalContent.children).forEach(child => {
        if (!child.classList.contains('close')) {
            child.remove();
        }
    });

    const detailsHTML = `
        <h2 style="color: #8B4513;">${event.title}</h2>
        ${imageHtml}
        <p><strong>Wann:</strong> ${timeDisplay}</p>
        <p><strong>Wo:</strong> ${locationLink}</p>
        
        <hr style="border-top: 1px solid ${providerColor}; margin: 15px 0;">
        
        <p><strong>Anbieter:</strong>
            <strong style="color: ${safeLinkColor}; cursor: pointer;" onclick="showVeranstalterDetails(${event.providerId})">
                ${providerName} (Details anzeigen)
            </strong>
        </p>
        <h3 style="margin-top: 20px;">Beschreibung:</h3>
        <p>${cleanedDescription.replace(/\n/g, '<br>')}</p>
        
        <div class="calendar-buttons">
            <a href="${googleCalendarUrl}" target="_blank" class="calendar-link-btn">
                Zu Google Kalender hinzufügen
            </a>
            <button onclick="downloadICS(window.eventDetailsCache)" class="calendar-link-btn">
                Als .ics-Datei herunterladen (Outlook, Apple)
            </button>
        </div>
        `;
    
    window.eventDetailsCache = event;
    
    modalContent.insertAdjacentHTML('beforeend', detailsHTML);
    eventModal.style.display = "block";
}


function showVeranstalterDetails(providerId) {
    closeModal('eventModal'); 

    const provider = providers.get(providerId);
    if (!provider) {
        console.error("Anbieter nicht gefunden:", providerId);
        return;
    }
    
    // KORREKT: DOM-Elemente im Modal füllen
    document.getElementById('modalProviderName').textContent = provider.name;
    document.getElementById('modalProviderContact').textContent = provider.contact || 'Keine Angabe';
    document.getElementById('modalProviderInfo').textContent = provider.info || 'Keine weiteren Informationen.';
    
    const linkElement = document.getElementById('modalProviderLink');
    if (provider.link) {
        linkElement.href = provider.link;
        linkElement.style.display = 'inline';
    } else {
        linkElement.style.display = 'none';
    }

    veranstalterModal.style.display = "block";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// NEU: Refresh-Funktion
function handleRefresh() {
    contentDiv.innerHTML = '';
    appLoader.style.display = 'block';
    headerTitle.textContent = "Aktualisiere..."; 

    currentFilterId = null;
    searchInput.value = '';
    
    fetchCalendarEvents(); 
    
    // Wechselt zur Events-Ansicht, falls wir auf einer anderen Ansicht waren
    switchView('events');
}

// --- 6. NAVIGATION UND START (KORRIGIERT: switchView) ---

function hideAllViews() {
    // Blendet nur die großen Content-Bereiche aus
    contentDiv.style.display = 'none';
    whatsappView.style.display = 'none';
    contactView.style.display = 'none';
}

function switchView(view) {
    // 1. Alle Nav-Buttons deaktivieren
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Alle großen Inhalte verstecken
    hideAllViews();

    // 3. Filter- und Suchleiste ZUERST AUSBLENDEN, dann ggf. EINBLENDEN
    filterContainer.style.display = 'none';
    searchContainer.style.display = 'none';
    
    // 4. Ansicht wechseln
    if (view === 'events' || view === 'providers') {
        // Für Events und Anbieter: Suchleiste ist sichtbar
        searchContainer.style.display = 'block';
        
        // Filter-Buttons sind nur für Events notwendig
        if (view === 'events') {
            filterContainer.style.display = 'block';
        }
        
        document.getElementById(`${view}-btn`).classList.add('active');
        headerTitle.textContent = (view === 'events' ? "Veranstaltungen" : "Anbieter");
        contentDiv.style.display = 'block';
        
        if (view === 'events') {
            // Zeige Events mit dem aktuellen oder Standardfilter
            applyCategoryFilter(currentFilterId); 
        } else {
            // Zeige Anbieter-Liste
            renderProviderList();
        }	

    } else if (view === 'whatsapp') {
        document.getElementById('whatsapp-btn').classList.add('active');
        headerTitle.textContent = "WhatsApp";
        whatsappView.style.display = 'block';
        
    } else if (view === 'contact') {
        document.getElementById('contact-btn').classList.add('active');
        headerTitle.textContent = "Feedback & Impressum"; 
        contactView.style.display = 'block';
    }
}

window.onload = () => {
        // NEU: FEIERTAGS-LOGIK FÜR SPLASH SCREEN
        const logoData = getSplashLogoPath();
        const splashLogo = document.querySelector('#splashScreen .splash-logo');
        
        document.querySelector('#splashScreen p').textContent = logoData.text;
        splashLogo.src = logoData.path;
        splashLogo.alt = logoData.path.replace('.jpg', '');
        
        fetchCalendarEvents();
        
        // Füge alle Nav-Button-Klicks hinzu
        document.getElementById('events-btn').onclick = () => switchView('events');
        document.getElementById('providers-btn').onclick = () => switchView('providers');
        document.getElementById('whatsapp-btn').onclick = () => switchView('whatsapp');
        document.getElementById('contact-btn').onclick = () => switchView('contact');
        
        // Refresh Button Event Listener
        document.getElementById('refreshButton').onclick = handleRefresh;

        // Suchfunktion nur für Events/Anbieter
        searchInput.addEventListener('input', filterEvents);
    };

    window.onclick = function(event) {
        if (event.target == eventModal) {
            eventModal.style.display = "none";
        }
        if (event.target == veranstalterModal) {
            veranstalterModal.style.display = "none";
        }
    }
    
    // --- 7. SERVICE WORKER REGISTRIERUNG ---
    if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(BASE_PATH + 'sw.js', {
            scope: BASE_PATH 
        })
        .then(registration => {
            console.log('ServiceWorker registriert mit Scope:', registration.scope);
        })
        .catch(error => {
            console.error('ServiceWorker Registrierung fehlgeschlagen:', error);
        });
    });
}
// --- ENDE SERVICE WORKER REGISTRIERUNG ---