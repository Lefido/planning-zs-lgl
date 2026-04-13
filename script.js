// Clés pour localStorage
const STORAGE_KEYS = {
  EVENTS: "planning_events",
  CURRENT_DATE: "planning_current_date",
};

let currentDate = new Date();
let selectedDate = null;
let events = {};

const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Jours de la semaine commençant par Lundi
const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Charger les données depuis localStorage au démarrage
function loadFromStorage() {
  try {
    // Charger les événements
    const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (savedEvents) {
      events = JSON.parse(savedEvents);
      showNotification("Données chargées");
    }

    // Charger la position du planning (mois/année)
    const savedDate = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
    if (savedDate) {
      const parsed = JSON.parse(savedDate);
      currentDate = new Date(parsed.year, parsed.month, 1);
    }
  } catch (error) {
    console.error("Erreur lors du chargement:", error);
    showNotification("Erreur de chargement");
  }
}

// Sauvegarder les événements dans localStorage
function saveEventsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des événements:", error);
  }
}

// Sauvegarder la position actuelle du planning
function saveCurrentDateToStorage() {
  try {
    const dateToSave = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, JSON.stringify(dateToSave));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la date:", error);
  }
}

// Sauvegarder toutes les données
function saveAllData() {
  saveEventsToStorage();
  saveCurrentDateToStorage();
}

// Afficher une notification
function showNotification(message) {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.classList.add("show");
  setTimeout(() => {
    notif.classList.remove("show");
  }, 2000);
}

// Initialisation
function init() {
  // Charger les données sauvegardées
  loadFromStorage();

  // Initialiser les sélecteurs de date manuels
  initManualDateSelectors();

  renderCalendar();

  // Sauvegarder la position quand on quitte la page
  window.addEventListener("beforeunload", saveAllData);

  // Sauvegarder périodiquement (toutes les 30 secondes)
  setInterval(saveAllData, 30000);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      const manualSelector = document.getElementById("manualDateSelector");
      if (manualSelector.classList.contains("active")) {
        toggleManualDateSelector();
      }
    }
  });
}

// Initialiser les sélecteurs de mois et d'année
function initManualDateSelectors() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  // Remplir le sélecteur de mois
  monthSelect.innerHTML = "";
  monthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // Remplir le sélecteur d'année (de 2020 à 2035)
  yearSelect.innerHTML = "";
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 5; year <= currentYear + 10; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

// Mettre à jour les sélecteurs avec la date actuelle
function updateManualDateSelectors() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  monthSelect.value = currentDate.getMonth();
  yearSelect.value = currentDate.getFullYear();
}

// Afficher/masquer le sélecteur de date manuel
function toggleManualDateSelector() {
  const selector = document.getElementById("manualDateSelector");

  if (selector.classList.contains("active")) {
    selector.classList.remove("active");
  } else {
    updateManualDateSelectors();
    selector.classList.add("active");
  }
}

// Appliquer la date manuelle sélectionnée
function applyManualDate() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  const selectedMonth = parseInt(monthSelect.value);
  const selectedYear = parseInt(yearSelect.value);

  currentDate = new Date(selectedYear, selectedMonth, 1);

  renderCalendar();
  saveCurrentDateToStorage();
  toggleManualDateSelector();
  showNotification("Date changée");
}

// Fonction d'impression optimisée
function printPlanning() {
  // Mettre à jour les infos d'impression
  const printInfo = document.getElementById("printInfo");
  const now = new Date();
  printInfo.innerHTML = `Imprimé le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} | Planning ZeShoes & LGL - ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Déclencher l'impression
  window.print();
}

// Obtenir le premier jour du mois en commençant par lundi (0 = lundi, 6 = dimanche)
function getFirstDayOfMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  // Convertir: 0 (dimanche) -> 6, 1 (lundi) -> 0, etc.
  return firstDay === 0 ? 6 : firstDay - 1;
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById("monthYear").textContent =
    `${monthNames[month]} ${year}`;

  const headerContainer = document.getElementById("calendarHeader");
  headerContainer.innerHTML = "";
  dayNames.forEach((day) => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = day;
    headerContainer.appendChild(header);
  });

  const bodyContainer = document.getElementById("calendarBody");
  bodyContainer.innerHTML = "";

  // Premier jour du mois (0 = lundi, 6 = dimanche)
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  // Jours du mois précédent pour compléter la première semaine
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = createDayCell(daysInPrevMonth - i, true);
    bodyContainer.appendChild(cell);
  }

  // Jours du mois en cours
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === today.getDate();
    const cell = createDayCell(day, false, isToday, year, month);
    bodyContainer.appendChild(cell);
  }

  // Jours du mois suivant pour compléter la dernière semaine
  const totalCells = firstDay + daysInMonth;
  const rowsNeeded = Math.ceil(totalCells / 7);
  const totalCellsNeeded = rowsNeeded * 7;
  const remainingCells = totalCellsNeeded - totalCells;

  for (let day = 1; day <= remainingCells; day++) {
    const cell = createDayCell(day, true);
    bodyContainer.appendChild(cell);
  }
}

function createDayCell(
  day,
  isOtherMonth,
  isToday = false,
  year = null,
  month = null,
) {
  const cell = document.createElement("div");
  cell.className = "day-cell";

  if (isOtherMonth) {
    cell.classList.add("other-month");
  }

  if (isToday) {
    cell.classList.add("today");
  }

  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = day;
  cell.appendChild(dayNumber);

  if (!isOtherMonth && year !== null && month !== null) {
    const dateKey = formatDateKey(year, month, day);
    const dayEvents = events[dateKey];

    const eventContainer = document.createElement("div");
    eventContainer.className = "event-container";

    if (dayEvents && (dayEvents.zeshoes || dayEvents.lgl)) {
      if (dayEvents.zeshoes) {
        const zeshoesBox = document.createElement("div");
        zeshoesBox.className = "event-zeshoes-box";
        zeshoesBox.innerHTML = `
                            <div class="event-zeshoes-title">ZeShoes</div>
                            <div class="event-zeshoes-name">${escapeHtml(dayEvents.zeshoes)}</div>
                        `;
        eventContainer.appendChild(zeshoesBox);
      }

      if (dayEvents.lgl) {
        const lglBox = document.createElement("div");
        lglBox.className = "event-lgl-box";
        lglBox.innerHTML = `
                            <div class="event-lgl-title">LGL</div>
                            <div class="event-lgl-name">${escapeHtml(dayEvents.lgl)}</div>
                        `;
        eventContainer.appendChild(lglBox);
      }
    }

    cell.appendChild(eventContainer);
    cell.addEventListener("click", () => openModal(year, month, day));
  }

  return cell;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  renderCalendar();
  saveCurrentDateToStorage();
}

function resetToToday() {
  currentDate = new Date();
  renderCalendar();
  saveCurrentDateToStorage();
  showNotification("Retour à aujourd'hui");
}

function openModal(year, month, day) {
  selectedDate = { year, month, day };
  const dateKey = formatDateKey(year, month, day);
  const dayEvents = events[dateKey] || {};

  const dateStr = new Date(year, month, day).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("modalDate").textContent = dateStr;

  document.getElementById("zeshoesName").value = dayEvents.zeshoes || "";
  document.getElementById("lglName").value = dayEvents.lgl || "";

  const deleteBtn = document.getElementById("deleteBtn");
  deleteBtn.style.display =
    dayEvents.zeshoes || dayEvents.lgl ? "block" : "none";

  document.getElementById("modal").classList.add("active");
  setTimeout(() => document.getElementById("zeshoesName").focus(), 100);
}

function closeModal() {
  document.getElementById("modal").classList.remove("active");
  selectedDate = null;
}

function saveEvents() {
  if (!selectedDate) return;

  const dateKey = formatDateKey(
    selectedDate.year,
    selectedDate.month,
    selectedDate.day,
  );
  const zeshoesName = document.getElementById("zeshoesName").value.trim();
  const lglName = document.getElementById("lglName").value.trim();

  if (zeshoesName || lglName) {
    events[dateKey] = {};
    if (zeshoesName) events[dateKey].zeshoes = zeshoesName;
    if (lglName) events[dateKey].lgl = lglName;
  } else {
    delete events[dateKey];
  }

  saveEventsToStorage();

  closeModal();
  renderCalendar();
  showNotification("Sauvegardé");
}

function deleteEvents() {
  if (!selectedDate) return;

  const dateKey = formatDateKey(
    selectedDate.year,
    selectedDate.month,
    selectedDate.day,
  );
  delete events[dateKey];

  saveEventsToStorage();

  closeModal();
  renderCalendar();
  showNotification("Supprimé");
}

document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

// Swipe pour changer de mois
let touchStartX = 0;
document.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].screenX;
  },
  false,
);

document.addEventListener(
  "touchend",
  (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      changeMonth(diff > 0 ? 1 : -1);
    }
  },
  false,
);

// Démarrer l'application
init();
