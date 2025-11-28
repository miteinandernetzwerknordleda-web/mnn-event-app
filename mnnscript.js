
    // --- 1. KONFIGURATION ---
    const API_KEY = 'AIzaSyDDsCuRzCYH-U3tjoTu1VCiv641zY7K4Cc';
    const CALENDAR_ID = 'miteinander.netzwerk.nordleda@gmail.com';
    const MIN_SPLASH_DURATION = 4000; 
    
    // NEUE KONSTANTEN FÜR ALLE FEIERTAGS-LOGOS
    const DEFAULT_LOGO_PATH = 'logo.png'; 
    const ADVENT_LOGO_BASE = 'mnnsplashadv'; // mnnsplashadv1.jpg, mnnsplashadv2.jpg usw.
    const LOGO_EXTENSION = '.jpg'; 
    
    // ZUSÄTZLICHE FEIERTAGS-KONSTANTEN
    const CHRISTMAS_LOGO = 'mnnsplashtannen' + LOGO_EXTENSION;
    const NEW_YEARS_LOGO = 'mnnsplashfeuerwerk' + LOGO_EXTENSION;
    const VALENTINE_LOGO = 'mnnsplashvalentins' + LOGO_EXTENSION;
    const EASTER_LOGO = 'mnnsplashostern' + LOGO_EXTENSION;
    const UNITY_DAY_LOGO = 'mnnsplashdeutsch' + LOGO_EXTENSION; // Tag der Deutschen Einheit (03.10.)
    
    // Basisdaten für die Anbieter
    const providers = [
        { id: 1, name: "TSV Nordleda", contact: "Jürgen Hoberg Tel. 04758-546", info: "Der lokale Sportverein mit verschiedenen Angeboten", link: "https://www.nordleda.de/vereine-und-choere/tsv-nordleda-ev/", color: "#a4bdfc" },
        { id: 2, name: "DRK Nordleda", contact: "Anja von Bebern Tel. 04758-679", info: "Der DRK Ortsverein bietet mit dem Arbeitskreis viele verschiedene Veranstaltungen", color: "#ff887c" },
        { id: 3, name: "Schützenverein Nordleda", contact: "Über das Kontaktformular auf der Webseite", info: "Schützenverein Nordleda von 1953 e.V.", link: "https://www.svnordleda.de/", color: "#7ae7bf" },
        { id: 4, name: "Kirchengemeinde Nordleda", contact: "meike.mueller-bilgenroth@evlka.de", info: "Die Kirchengemeinde St. Nicolai in Nordleda", link: "https://www.kk-ch.de/gemeinden/nordleda/", color: "#dbadff" },
		{ id: 5, name: "taktlos-Chor", contact: "Über das Kontaktformular auf der Webseite", info: "...der a cappella Männerchor", link: "https://www.gruppe-taktlos.de/", color: "#5484ed" },
		{ id: 6, name: "LoGos-Chor Nordleda", contact: "Gunda Knust Tel. 04758-326", info: "Lobpreis-Gospelchor", color: "#8A2BE2" },
		{ id: 7, name: "FamilienHaven Nordleda", contact: "Serina Naß Tel. 015256302291", info: "Delfi Kurse - Fachkraft für Beikost, Elternvorbereitung, Säuglingspflege, Achtsamkeit", link: "https://www.instagram.com/delfinordleda/", color: "#fbd75b" },
		{ id: 8, name: "Werbegemeinschaft Nordleda", contact: "Hans-Hermann Ropers Tel. 04758-444", info: "Werbegemeinschaft des Ortes Nordleda", color: "#ffacac" },
		{ id: 9, name: "CDU Nordleda", contact: "Hans-Hermann Ropers Tel. 04758-444", info: "CDU Ortsverband Nordleda", link: "https://www.cdu-land-hadeln.de/ortsverbaende/nordleda/", color: "#000000" },
		{ id: 10, name: "SoVD Neuenkirchen/Nordleda", contact: "Über das Kontaktformular auf der Webseite", info: "Sozialverband Deutschland", link: "https://www.sovd-cuxhaven.de/verband-990125?verbandid=991896&cHash=f253ff976383e4a74d925e676582cb7b", color: "#D3D3D3" },
		{ id: 11, name: "Miteinander Netzwerk Nordleda", contact: "miteinander.netzwerk.nordleda@gmail.com", info: "Interessengruppe zur Stärkung des Gemeinschaftsgefüges", link: "https://sites.google.com/view/netzwerknordleda/start", color: "#EE00EE" },
		{ id: 12, name: "Feuerwehr Nordleda", contact: "info@feuerwehr-nordleda.de", info: "Freiwillige Feuerwehr und Jugendfeuerwehr Nordleda", link: "https://www.instagram.com/ffw_nordleda/?hl=de", color: "#FF0000" },
		{ id: 99, name: "Freier Anbieter", contact: "Evtl. über die Veranstaltungsbeschreibung", info: "verschiedene Anbieter von Veranstaltungen", color: "#F8F8FF" }

    ];
	
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

    let dynamicEvents = [];
    let currentFilterId = null; 
    let startTime; 
    window.eventDetailsCache = null; 
	let lastKnownEvents = [];

    // --- 2. HILFSFUNKTIONEN ---

    function extractProviderId(titleString) {
        if (!titleString) return null;
        const match = titleString.trim().match(/\(ID:(\d+)\)/i);
        return match ? parseInt(match[1]) : null;
    }
    
    function cleanTitle(titleString) {
        if (!titleString) return 'Unbekanntes Event';
        return titleString.replace(/\s*\(ID:\d+\)\s*/i, '').trim();
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

// ERWEITERTE FEIERTAGS-LOGIK START

	function getFirstAdventDate(year) {
		// 1. Advent ist der Sonntag, der dem 30. November am nächsten liegt (fällt zwischen 27. Nov. und 3. Dez.).
		const nov30 = new Date(year, 10, 30); // Monat 10 ist November (0-basiert)
		const dayOfWeek = nov30.getDay(); // 0 (Sonntag) bis 6 (Samstag)
		
		// Berechne das Datum des Sonntags am oder vor dem 30. Nov.
		let date = 30 - dayOfWeek;
		
		// Wenn das berechnete Datum vor dem 27. Nov. liegt, brauchen wir den nächsten Sonntag (Dez 1, 2, oder 3)
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
		let month = 3; // März
		
		if (day > 31) {
			month = 4; // April
			day = day - 31;
		}
		
		if (d === 29 && e === 6 && year >= 1900) {
			day = 19;
			month = 4; // 19. April
		}
		if (d === 28 && e === 6 && a > 10 && year >= 1900) {
			day = 18;
			month = 4; // 18. April
		}
		
		// Ostersonntag
		const easter = new Date(year, month - 1, day);
		easter.setHours(0, 0, 0, 0);
		return easter;
	}

// ERWEITERTE FEIERTAGS-LOGIK START

// ... (getFirstAdventDate und getEasterDate bleiben unverändert) ...

	function getSplashLogoPath() {
		// Helper-Funktion, um Datumsbereiche leicht zu prüfen
		// month ist 0-basiert (Jan=0, Dez=11)
		const checkDateRange = (now, monthStart, dayStart, monthEnd, dayEnd) => {
			const year = now.getFullYear();
			const start = new Date(year, monthStart, dayStart);
			const end = new Date(year, monthEnd, dayEnd);
			end.setHours(23, 59, 59, 999);
			return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
		};
		
		const now = new Date();
		const year = now.getFullYear();
		
		// --- 1. Fixe Feiertage (Jahr-übergreifend) ---
		
		// 1.1 Neujahr (01.01.)
		if (checkDateRange(now, 0, 1, 0, 1)) {
			return { path: NEW_YEARS_LOGO, text: "Frohes neues Jahr!" };
		}
		
		// 1.2 Valentinstag (14.02.)
		if (checkDateRange(now, 1, 14, 1, 14)) {
			return { path: VALENTINE_LOGO, text: "Alles Liebe zum Valentinstag!" };
		}
		
		// 1.3 Tag der Deutschen Einheit (03.10.)
		if (checkDateRange(now, 9, 3, 9, 3)) {
			return { path: UNITY_DAY_LOGO, text: "Herzliche Grüße zum Tag der Deutschen Einheit!" };
		}
		
		// --- 2. Bewegliche Feiertage (Ostern) ---
		const easterSunday = getEasterDate(year);
		const goodFriday = new Date(easterSunday);
		goodFriday.setDate(easterSunday.getDate() - 2);
		const easterMonday = new Date(easterSunday);
		easterMonday.setDate(easterSunday.getDate() + 1);
		
		// Ostern (Karfreitag bis Ostermontag)
		if (now.getTime() >= goodFriday.getTime() && now.getTime() <= easterMonday.getTime()) {
			return { path: EASTER_LOGO, text: "Frohe Ostern!" };
		}

		// --- 3. Silvester (31.12.) ---
		// Muss vor Weihnachten geprüft werden, da Weihnachten an manchen Tagen des Jahres am Ende liegt.
		if (checkDateRange(now, 11, 31, 11, 31)) {
			return { path: NEW_YEARS_LOGO, text: "Guten Rutsch!" };
		}
		
		// --- 4. Weihnachten (Heiligabend, 1. & 2. Weihnachtstag: 24.12. bis 26.12.) ---
		if (checkDateRange(now, 11, 24, 11, 26)) {
			return { path: CHRISTMAS_LOGO, text: "Frohe Weihnachten!" };
		}
		
		// --- 5. Adventszeit (Prüft den 1., 2., 3., 4. Advent) ---
		const firstAdvent = getFirstAdventDate(year);
		const MS_PER_DAY = 1000 * 60 * 60 * 24;
		
		// Wir prüfen die Zeitspanne vom 1. Advent bis zum 24. Dezember (exklusiv)
		const christmasEveStart = new Date(year, 11, 24); 
		christmasEveStart.setHours(0, 0, 0, 0); 
		
		if (now.getTime() >= firstAdvent.getTime() && now.getTime() < christmasEveStart.getTime()) {
			
			const diffTime = now.getTime() - firstAdvent.getTime();
			const diffDays = Math.floor(diffTime / MS_PER_DAY);
			
			// Adventswoche: 0-6 Tage = 1. Advent, 7-13 Tage = 2. Advent, etc.
			let adventWeek = Math.floor(diffDays / 7);
			
			// Logik: 0 -> 1, 1 -> 2, 2 -> 3, 3 -> 4
			let logoIndex = adventWeek + 1; 
			
			// Begrenzung: Wir sind definitiv in der Adventszeit, aber maximal 4. Advent.
			if (logoIndex > 4) {
				 logoIndex = 4;
			}

			const weekNumber = logoIndex;
			return { path: ADVENT_LOGO_BASE + logoIndex + LOGO_EXTENSION, text: `Frohe ${weekNumber}. Adventswoche!` };
		}


		// --- 6. Standard-Logo (Wenn kein Feiertag) ---
		return { path: DEFAULT_LOGO_PATH, text: "Lade Events..." };
	}
// ERWEITERTE FEIERTAGS-LOGIK END


// HILFSFUNKTIONEN FÜR KALENDER-BUTTONS
	function formatToCalendarDateString(dateObject, isAllDay) {
		// Google Calendar URL und ICS verwenden das YYYYMMDD-Format für Ganztagesevents
		const year = dateObject.getFullYear();
		const month = ('0' + (dateObject.getMonth() + 1)).slice(-2);
		const day = ('0' + dateObject.getDate()).slice(-2);

		if (isAllDay) {
			return `${year}${month}${day}`; // YYYYMMDD
		} else {
			// YYYYMMDDTHHMMSS (Lokale Zeit)
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

		// 1. Startzeitpunkt bestimmen
		if (isAllDay) {
			// All-Day: Start ist Mitternacht
			startMoment.setHours(0, 0, 0, 0); 
		} else {
			// Timed Event: Zeit aus event.date parsen (z.B. "20:00 Uhr")
			const timeMatch = event.date.match(/(\d{2}):(\d{2})/);
			if (timeMatch) {
				startMoment.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
			}
		}
		
		// 2. Endzeitpunkt bestimmen
		if (isAllDay) {
			// All-Day: Endet am nächsten Tag um Mitternacht (exklusiv)
			endMoment = new Date(startMoment);
			endMoment.setDate(endMoment.getDate() + 1);
		} else {
			// Timed Event: Endzeit aus event.endDate parsen (z.B. "22:00 Uhr")
			endMoment = new Date(startMoment);
			const endTimeMatch = event.endDate.match(/(\d{2}):(\d{2})/);
			if (endTimeMatch) {
				endMoment.setHours(parseInt(endTimeMatch[1]), parseInt(endTimeMatch[2]), 0, 0);
				
				// Falls Endzeit vor Startzeit liegt (über Mitternacht hinaus):
				if(endMoment.getTime() < startMoment.getTime()) {
					endMoment.setDate(endMoment.getDate() + 1);
				}
			} else {
				// Falls Endzeit fehlt: 1 Stunde Dauer
				endMoment.setHours(startMoment.getHours() + 1);
			}
		}

		// 3. Formatierung für URL
		let startFormatted = formatToCalendarDateString(startMoment, isAllDay);
		let endFormatted = formatToCalendarDateString(endMoment, isAllDay);
		
		const datesParam = `${startFormatted}/${endFormatted}`;

		const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${description}&location=${location}&sf=true`;
		
		return calendarUrl;
	}

	function getICSContent(event) {
		const provider = providers.find(p => p.id == event.providerId);
		const organizer = provider ? `ORGANIZER;CN=${provider.name}:mailto:${provider.contact || 'noreply@nordleda.de'}` : '';

		// Datum- & Zeit-Objekte (gleiche Logik wie in getGoogleCalendarUrl)
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
		
		// ICS benötigt YYYYMMDDTHHMMSS im lokalen Format oder DTSTART;VALUE=DATE für all-day
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
			// DTSTART;VALUE=DATE:YYYYMMDD
			icsStartLine = `DTSTART;VALUE=DATE:${icsFormatDate(startMoment)}`;
			// DTEND;VALUE=DATE:YYYYMMDD (exklusiv, also +1 Tag)
			icsEndLine = `DTEND;VALUE=DATE:${icsFormatDate(endMoment)}`; 
		} else {
			// DTSTART:YYYYMMDDTHHMMSS
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
			// Description muss Zeilenumbrüche mit \n und andere Sonderzeichen maskieren
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
		
		// Erstellt eine temporäre Blob-URL, um den Download auszulösen
		const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		// Ersetzt alle Nicht-Alphanumerischen Zeichen mit Unterstrich für den Dateinamen
		link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.ics`); 
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
// ENDE HILFSFUNKTIONEN FÜR KALENDER-BUTTONS


// --- 3. DATENABRUF VON GOOGLE KALENDER ---

	function fetchCalendarEvents() {
		startTime = Date.now(); 
		
		// Falls wir bereits gecachte Events haben, zeigen wir diese sofort an
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
		// Löschen des Inhalts nur, wenn wir noch keine Events haben
		if (lastKnownEvents.length === 0) {
			contentDiv.innerHTML = '';
		}

		const threeMonthsFromNow = new Date();
		threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
		const timeMaxParam = threeMonthsFromNow.toISOString();

		const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${(new Date()).toISOString()}&timeMax=${timeMaxParam}&singleEvents=true&orderBy=startTime`;

		fetch(API_URL)
			.then(response => {
				if (!response.ok) {
					// Wenn die Antwort nicht OK ist (z.B. 404, 403), werfen wir einen Fehler
					throw new Error(`HTTP error! status: ${response.status}.`);
				}
				return response.json();
			})
			.then(data => {
				// Daten erfolgreich geladen: Neue Events verarbeiten und speichern
				dynamicEvents = data.items.map((item, index) => {
					// ... (Hier der gesamte Mapping-Block, der Event-Daten verarbeitet) ...
					// Fügen Sie den kompletten Event-Mapping-Code von Zeile 1100 bis 1150 HIER ein
					
					const rawTitle = item.summary || '';
					const providerId = extractProviderId(rawTitle);
					
					const isTimedEvent = !!item.start.dateTime;
					const eventStart = new Date(item.start.dateTime || item.start.date);
					
					let startDate;
					let endDate = '';

					if (isTimedEvent) {
						// Beispiel: "21. November 2025, 20:00 Uhr"
						startDate = eventStart.toLocaleDateString('de-DE', {
							year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
						}).replace(':', ':').trim();
						
						// Nur Endzeit extrahieren (z.B. "22:00 Uhr")
						const eventEnd = new Date(item.end.dateTime);
						endDate = eventEnd.toLocaleTimeString('de-DE', {
							hour: '2-digit', minute: '2-digit'
						}).trim() + ' Uhr';


					} else {
						// Ganztägige Events
						const tempDate = new Date(item.start.date);
						// Korrektur: All-day Events in Google Calendar werden manchmal als 'end: 2025-11-22' und 'start: 2025-11-21' geliefert
						// Wir nehmen nur den Starttag und ignorieren die Zeit.
						
						startDate = tempDate.toLocaleDateString('de-DE', {
							year: 'numeric', month: 'long', day: 'numeric'
						}).trim();
					}

					const dayOfMonth = eventStart.getDate();
					const dayOfWeekShort = eventStart.toLocaleDateString('de-DE', {
						weekday: 'short'
					}).slice(0, 2);
					
					// Monat/Jahr für die Sortierung speichern
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
				
				// NEU: Events global speichern und anzeigen
				lastKnownEvents = dynamicEvents; 
				appLoader.style.display = 'none';
				
				// FILTERLEISTE SICHTBAR MACHEN UND INITIALISIEREN
				createFilterButtons(); 
				filterContainer.style.display = 'block';
				applyCategoryFilter(null);
				
				hideSplash(); 
			})	
		.catch(error => {
				// Fehlerbehandlung für Offline-Modus oder API-Fehler
				appLoader.style.display = 'none';
				hideSplash(); 
				
				// WICHTIG: Prüfen, ob wir Events gespeichert haben
				if (lastKnownEvents.length > 0) {
					 console.log("Offline-Modus: Zeige letzte bekannte Events.");
					 headerTitle.textContent = "Veranstaltungen (Offline)";
					 
					 // **WICHTIGE KORREKTUR:** Wir rufen applyCategoryFilter(null) auf.
					 // Diese Funktion rendert die Events UND erstellt die Filter-Buttons neu.
					 applyCategoryFilter(null); // Zeigt alle Events aus lastKnownEvents an!
					 
					 // Stellt sicher, dass die Filterleiste sichtbar ist
					 filterContainer.style.display = 'block';

				} else {
					// Wenn wir KEINE Events im Speicher haben, dann zeigen wir den Fehler
					headerTitle.textContent = "Veranstaltungen";
					// Der Fehlertext, den Sie sehen
					contentDiv.innerHTML = `<p style="margin: 20px; color: red;">Konnte Events nicht laden: Du bist offline oder der Server ist nicht erreichbar.</p>`;
					console.error("Error fetching events:", error);
					
					// Setzt den Filter-Container unsichtbar, da keine Daten da sind
					filterContainer.style.display = 'none';
				}
			});
	}
	
// --- 4. FUNKTIONEN ZUM RENDERN DER LISTEN (MIT MONATSTRENNUNG) ---
	function renderEventList(eventsToRender = dynamicEvents) {
		headerTitle.textContent = "Veranstaltungen";
		contentDiv.innerHTML = '';
		
		// Sortierung der Events nach Datum
		eventsToRender.sort((a, b) => a.sortDate - b.sortDate);

		if (eventsToRender.length === 0) {
			contentDiv.innerHTML = `<p style="margin: 20px;">Keine zukünftigen Veranstaltungen gefunden.</p>`;
			return;
		}
		
		let currentMonth = null;
		const dateFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

		eventsToRender.forEach(event => {
			const provider = providers.find(p => p.id == event.providerId);
			const providerName = provider ? provider.name : "Unbekannter Anbieter";
			const cardColor = provider ? provider.color : '#aaaaaa';
			
			// Monat und Jahr formatieren
			const monthAndYear = dateFormatter.format(event.sortDate);
			
			// PRÜFUNG AUF MONATSWECHSEL
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

// --- FUNKTIONEN FÜR KATEGORIE-FILTER ---
	function createFilterButtons() {
		const filterContainer = document.getElementById('filter-container');
		filterContainer.innerHTML = '';
		
		const allBtn = document.createElement('span');
		allBtn.className = 'filter-btn selected';
		allBtn.textContent = 'Alle Events';
		allBtn.onclick = () => {
			searchInput.value = ''; 
			applyCategoryFilter(null);
		};
		filterContainer.appendChild(allBtn);

		providers.forEach(provider => {
			if (provider.id !== 99 && provider.id !== 11) {
				const btn = document.createElement('span');
				btn.className = 'filter-btn';
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
		
		// 1. **DEFINIERE DIE DATENQUELLE**
		// WICHTIG: Wenn dynamicEvents (Online-Daten) leer sind, 
		// verwende die letzte bekannte Version (lastKnownEvents).
		const sourceData = dynamicEvents.length > 0 ? dynamicEvents : lastKnownEvents;

		// 2. **FILTERN DER DATEN**
		// Filtere zuerst die gesamte Datenquelle
		let filteredEvents = sourceData;

		if (currentFilterId !== null) {
			filteredEvents = sourceData.filter(event => event.providerId === currentFilterId);
		}
		
		// Wenn gesucht wird, filtere zusätzlich nach Suchbegriffen
		const searchTerm = searchInput.value.toLowerCase();
		if (searchTerm) {
			filteredEvents = filteredEvents.filter(event => 
				event.title.toLowerCase().includes(searchTerm) ||
				event.description.toLowerCase().includes(searchTerm)
			);
		}

		// 3. **RENDERN UND ANZEIGEN**
		// Die Event-Liste rendern
		renderEventList(filteredEvents); 
	}
// --- ENDE FUNKTIONEN FÜR KATEGORIE-FILTER ---


    function renderProviderList(providersToRender = providers) {
        headerTitle.textContent = "Anbieter";
        contentDiv.innerHTML = '';
        
        // Filterleiste ausblenden
        document.getElementById('filter-container').style.display = 'none';

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
				const provider = providers.find(p => p.id == event.providerId);
				const providerName = provider ? provider.name.toLowerCase() : '';
				
				const matchesSearchTerm = event.title.toLowerCase().includes(searchTerm) ||
										  event.location.toLowerCase().includes(searchTerm) ||
										  providerName.includes(searchTerm);
										  
				if (searchTerm.length > 0) {
					return matchesSearchTerm;
				} else {
					return currentFilterId === null || event.providerId === currentFilterId;
				}
			});
			
			if (searchTerm.length > 0) {
				document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('selected'));
			} else {
				 applyCategoryFilter(currentFilterId);
			}


			renderEventList(filteredEvents);

		} else if (document.getElementById('providers-btn').classList.contains('active')) {
			const filteredProviders = providers.filter(provider => {
				return provider.name.toLowerCase().includes(searchTerm) ||
					   provider.info.toLowerCase().includes(searchTerm);
			});
			renderProviderList(filteredProviders);
		}
	}

// --- 5. FUNKTIONEN ZUM ANZEIGEN DER DETAILS (MIT KALENDER-LOGIK) ---
	function showEventDetails(event) {
		const provider = providers.find(p => p.id == event.providerId);
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

		// NEU: Zeit-Anzeige korrigiert (Timed vs. All-Day)
		let timeDisplay;
		if (event.endDate) {
			// Timed Event: event.date enthält Startdatum/zeit, event.endDate enthält Endzeit
			const startDatePart = event.date.split(',')[0]; // z.B. "21. November 2025"
			const startTimePart = event.date.match(/(\d{2}:\d{2})/)?.[0] || '';
			
			if(startTimePart) {
				// Angabe mit Start- und Endzeit
				timeDisplay = `Am ${startDatePart} von ${startTimePart} bis ${event.endDate}`;
			} else {
				// Falls Startzeit fehlt, nur Datum und Endzeit
				timeDisplay = `${event.date} bis ${event.endDate}`;
			}
		} else {
			timeDisplay = `${event.date} (Ganztägig)`;
		}
			
		const locationEncoded = encodeURIComponent(event.location);
		
		// Korrigierte Google Maps URL
		const mapsUrl = `https://www.google.com/maps/search/?api=1&query=$${locationEncoded}`; 
		const locationLink = `<a href="https://maps.google.com/?q=$${locationEncoded}" target="_blank" style="color: ${safeLinkColor}; font-weight: bold;">${event.location} (Auf Karte anzeigen)</a>`;

		// NEU: Kalender-URL generieren
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
		
		// Event im Cache speichern, um es im ICS-Download verwenden zu können
		window.eventDetailsCache = event;
		
		modalContent.insertAdjacentHTML('beforeend', detailsHTML);
		eventModal.style.display = "block";
	}


    function showVeranstalterDetails(providerId) {
        closeModal('eventModal'); 

        const provider = providers.find(p => p.id === providerId);
        if (!provider) {
            console.error("Anbieter nicht gefunden:", providerId);
            return;
        }

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
        // 1. Ladehinweis und Spinner anzeigen
        contentDiv.innerHTML = '';
        appLoader.style.display = 'block';
        headerTitle.textContent = "Aktualisiere..."; 

        // 2. Events neu laden (mit Filter-Reset)
        currentFilterId = null;
        searchInput.value = '';
        
        // 3. Nach dem Laden wird der Loader in fetchCalendarEvents wieder versteckt
        fetchCalendarEvents(); 
        
        // 4. Zur Events-Ansicht wechseln, falls nötig
        switchView('events');
    }
    // ENDE NEU: Refresh-Funktion

// --- 6. NAVIGATION UND START (ERWEITERT) ---

	function hideAllViews() {
		contentDiv.style.display = 'none';
		whatsappView.style.display = 'none';
		contactView.style.display = 'none';
		filterContainer.style.display = 'none';
		
		// Suchcontainer komplett ausblenden, um den Platz zu entfernen
		searchContainer.style.display = 'none'; 
	}

	function switchView(view) {
		// 1. Alle Nav-Buttons deaktivieren
		document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
		
		// 2. Alle Inhalte verstecken
		hideAllViews();
		
		// 3. Ansicht wechseln
		if (view === 'events') {
			document.getElementById('events-btn').classList.add('active');
			headerTitle.textContent = "Veranstaltungen";
			contentDiv.style.display = 'block';
			searchContainer.style.display = 'block'; // Suchcontainer anzeigen
			searchInput.style.display = 'block';
			filterContainer.style.display = 'block'; 

			// Bei Event-View: Liste rendern/filtern
			applyCategoryFilter(currentFilterId);

		} else if (view === 'providers') {
			document.getElementById('providers-btn').classList.add('active');
			headerTitle.textContent = "Anbieter";
			contentDiv.style.display = 'block';
			searchContainer.style.display = 'block'; // Suchcontainer anzeigen
			searchInput.style.display = 'block';
			
			// Bei Anbieter-View: Liste rendern
			renderProviderList();

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
			
			// Logo-Pfad und Text setzen
			document.querySelector('#splashScreen p').textContent = logoData.text;
			splashLogo.src = logoData.path;
			splashLogo.alt = logoData.path.replace('.jpg', '');
			
			// ENDE FEIERTAGS-LOGIK

			fetchCalendarEvents();
			
			// Füge alle Nav-Button-Klicks hinzu
			document.getElementById('events-btn').onclick = () => switchView('events');
			document.getElementById('providers-btn').onclick = () => switchView('providers');
			document.getElementById('whatsapp-btn').onclick = () => switchView('whatsapp');
			document.getElementById('contact-btn').onclick = () => switchView('contact');
			
			// NEU: Refresh Button Event Listener
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
			navigator.serviceWorker.register('/mnn-event-app/sw.js', {
				scope: '/mnn-event-app/' // Wichtig: Der Scope muss auch korrigiert werden
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
