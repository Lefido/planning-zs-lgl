/**
 * Clés utilisées pour localStorage afin de persister les données.
 */
const STORAGE_KEYS = {
  EVENTS: "planning_events",     // Stocke tous les événements du planning
  CURRENT_DATE: "planning_current_date",  // Stocke la date courante affichée (mois/année)
};

/**
 * Variables globales du planning :
 * - currentDate : Date courante affichée dans le calendrier (1er jour du mois)
 * - selectedDate : Date sélectionnée dans le modal pour édition (null si aucun)
 * - events : Objet contenant tous les événements { 'YYYY-MM-DD': {zeshoes: 'nom', lgl: 'nom'} }
 */
let currentDate = new Date();
let selectedDate = null;
let events = {};

/**
 * Noms des mois en français (index 0 = Janvier)
 */
const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

/**
 * Abréviations des jours de la semaine en français, commençant par Lundi (index 0 = Lun)
 */
const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Charge les données persistées depuis localStorage au démarrage de l'application.
 * Restaure les événements et la date courante du calendrier.
 */
function loadFromStorage() {
  try {
    // Charger les événements du planning
    const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (savedEvents) {
      events = JSON.parse(savedEvents);
      showNotification("Données chargées avec succès");
    }

    // Restaurer la position du calendrier (mois et année précédemment affichés)
    const savedDate = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
    if (savedDate) {
      const parsed = JSON.parse(savedDate);
      currentDate = new Date(parsed.year, parsed.month, 1);  // 1er jour du mois
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    showNotification("Erreur lors du chargement des données");
  }
}

/**
 * Sauvegarde l'objet events complet dans localStorage.
 * Appelée après chaque modification d'événement.
 */
function saveEventsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des événements:", error);
  }
}

/**
 * Sauvegarde la date courante du calendrier (année et mois) dans localStorage.
 * Permet de restaurer la vue à l'ouverture suivante.
 */
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

/**
 * Sauvegarde complète : événements + position calendrier.
 * Appelée au beforeunload et périodiquement.
 */
function saveAllData() {
  saveEventsToStorage();
  saveCurrentDateToStorage();
}

/**
 * Affiche une notification temporaire (2 secondes) en haut de l'écran.
 * Utilisée pour feedback utilisateur (sauvegarde, erreurs, etc.)
 * @param {string} message - Texte à afficher
 */
function showNotification(message) {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.classList.add("show");
  setTimeout(() => {
    notif.classList.remove("show");
  }, 2000);
}

/**
 * Initialisation complète de l'application planning.
 * Charge données, initialise UI, configure event listeners.
 */
function init() {
  // 1. Restaurer les données depuis localStorage
  loadFromStorage();

  // 2. Préparer les sélecteurs manuels de date
  initManualDateSelectors();

  // 3. Rendre le calendrier initial
  renderCalendar();

  // 4. Sauvegarde automatique à la fermeture de la page
  window.addEventListener("beforeunload", saveAllData);

  // 5. Sauvegarde automatique toutes les 30 secondes (anti-perte)
  setInterval(saveAllData, 30000);

  // 6. Raccourci clavier Escape : fermer modal ou sélecteur
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

/**
 * Initialise les <select> HTML pour sélection manuelle de mois/année.
 * Remplit les options avec noms français et années ±5/10 ans.
 */
function initManualDateSelectors() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  // Remplir mois (0=Janvier ... 11=Décembre)
  monthSelect.innerHTML = "";
  monthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month;
    monthSelect.appendChild(option);
  });

  // Remplir années : de année_courante-5 à +10
  yearSelect.innerHTML = "";
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 5; year <= currentYear + 10; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

/**
 * Met à jour les valeurs des <select> pour refléter currentDate.
 * Appelée quand on ouvre le sélecteur.
 */
function updateManualDateSelectors() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  monthSelect.value = currentDate.getMonth();
  yearSelect.value = currentDate.getFullYear();
}

/**
 * Bascule l'affichage du panneau de sélection manuelle de date.
 * Met à jour les valeurs si ouverture.
 */
function toggleManualDateSelector() {
  const selector = document.getElementById("manualDateSelector");

  if (selector.classList.contains("active")) {
    selector.classList.remove("active");
  } else {
    updateManualDateSelectors();
    selector.classList.add("active");
  }
}

/**
 * Applique le mois/année sélectionnés manuellement : met à jour currentDate,
 * re-rend le calendrier, sauvegarde et ferme le panneau.
 */
function applyManualDate() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");

  const selectedMonth = parseInt(monthSelect.value);
  const selectedYear = parseInt(yearSelect.value);

  currentDate = new Date(selectedYear, selectedMonth, 1);

  renderCalendar();
  saveCurrentDateToStorage();
  toggleManualDateSelector();
  showNotification("Date appliquée avec succès");
}

/**
 * Prépare et lance l'impression du planning actuel.
 * Met à jour le header d'impression avec date/heure/mois.
 */
function printPlanning() {
  // Mettre à jour le bandeau d'impression
  const printInfo = document.getElementById("printInfo");
  const now = new Date();
  printInfo.innerHTML = `Imprimé le ${now.toLocaleDateString("fr-FR")} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} | Planning ZeShoes & LGL - ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Lancer la boîte de dialogue d'impression
  window.print();
}

/**
 * Calcule le jour de la semaine du 1er du mois, avec lundi=0, dimanche=6.
 * JS getDay() : dimanche=0, lundi=1...samedi=6 → conversion nécessaire.
 * @param {number} year - Année
 * @param {number} month - Mois (0-11)
 * @returns {number} Position du 1er (0=lundi, 6=dimanche)
 */
function getFirstDayOfMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay();  // 0=dim,1=lun,...,6=sam
  // Conversion : dim(0)→6, lun(1)→0, mar(2)→1, ..., sam(6)→5
  return firstDay === 0 ? 6 : firstDay - 1;
}

/**
 * Rendu complet du calendrier pour le mois/année de currentDate.
 * Gère en-têtes jours, cellules (précédent/mois courant/suivant), événements, today highlight.
 */
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Titre mois/année
  document.getElementById("monthYear").textContent = `${monthNames[month]} ${year}`;

  // En-têtes des jours (Lun...Dim)
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

  // Calculs pour le rendu
  const firstDay = getFirstDayOfMonth(year, month);  // Position 1er jour (0=lun)
  const daysInMonth = new Date(year, month + 1, 0).getDate();  // Nb jours courant
  const daysInPrevMonth = new Date(year, month, 0).getDate();  // Nb jours précédent

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // 1. Jours précédent mois pour remplir 1ère semaine
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = createDayCell(daysInPrevMonth - i, true);  // other-month
    bodyContainer.appendChild(cell);
  }

  // 2. Jours du mois courant + highlight today + événements
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === today.getDate();
    const cell = createDayCell(day, false, isToday, year, month);
    bodyContainer.appendChild(cell);
  }

  // 3. Jours suivant pour remplir 6ème semaine si nécessaire (max 42 cellules)
  const totalCells = firstDay + daysInMonth;
  const rowsNeeded = Math.ceil(totalCells / 7);
  const totalCellsNeeded = rowsNeeded * 7;
  const remainingCells = totalCellsNeeded - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const cell = createDayCell(day, true);  // other-month
    bodyContainer.appendChild(cell);
  }
}

/**
 * Crée une cellule de jour pour le calendrier.
 * Gère numéro, classes CSS (today/other-month), affichage événements, clic→modal.
 * @param {number} day - Numéro du jour
 * @param {boolean} isOtherMonth - Vrai si mois précédent/suivant (gris)
 * @param {boolean} [isToday=false] - Vrai si jour actuel
 * @param {number|null} year - Année (pour événements)
 * @param {number|null} month - Mois (pour événements)
 * @returns {HTMLDivElement} Cellule prête
 */
function createDayCell(day, isOtherMonth, isToday = false, year = null, month = null) {
  const cell = document.createElement("div");
  cell.className = "day-cell";

  if (isOtherMonth) cell.classList.add("other-month");
  if (isToday) cell.classList.add("today");

  // Numéro du jour
  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = day;
  cell.appendChild(dayNumber);

  if (!isOtherMonth && year !== null && month !== null) {
    // Événements pour ce jour
    const dateKey = formatDateKey(year, month, day);
    const dayEvents = events[dateKey];

    const eventContainer = document.createElement("div");
    eventContainer.className = "event-container";

    if (dayEvents && (dayEvents.zeshoes || dayEvents.lgl)) {
      // Box ZeShoes si présent
      if (dayEvents.zeshoes) {
        const zeshoesBox = document.createElement("div");
        zeshoesBox.className = "event-zeshoes-box";
        zeshoesBox.innerHTML = `
          <div class="event-zeshoes-title">ZeShoes</div>
          <div class="event-zeshoes-name">${escapeHtml(dayEvents.zeshoes)}</div>
        `;
        eventContainer.appendChild(zeshoesBox);
      }

      // Box LGL si présent
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
    // Clic → ouvre modal édition
    cell.addEventListener("click", () => openModal(year, month, day));
  }

  return cell;
}

/**
 * Échappe le HTML pour éviter les injections XSS lors d'affichage noms.
 * @param {string} text - Texte utilisateur à sécuriser
 * @returns {string} Texte échappé safe
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Formate une date en clé unique pour localStorage : 'YYYY-MM-DD'.
 * @param {number} year - Année
 * @param {number} month - Mois (0-11 → 01-12)
 * @param {number} day - Jour (1-31 → 01-31)
 * @returns {string} Clé '2024-09-15'
 */
function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Navigue mois précédent/suivant.
 * @param {number} direction - 1=suivant, -1=précédent
 */
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  renderCalendar();
  saveCurrentDateToStorage();
}

/**
 * Remet le calendrier sur le mois courant.
 */
function resetToToday() {
  currentDate = new Date();
  renderCalendar();
  saveCurrentDateToStorage();
  showNotification("Retour au mois courant");
}

/**
 * Ouvre le modal d'édition pour une date spécifique.
 * Remplit les champs avec événements existants, focus auto.
 */
function openModal(year, month, day) {
  selectedDate = { year, month, day };
  const dateKey = formatDateKey(year, month, day);
  const dayEvents = events[dateKey] || {};

  // Affichage lisible de la date (lundi 15 septembre 2024)
  const dateStr = new Date(year, month, day).toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  document.getElementById("modalDate").textContent = dateStr;

  // Remplir champs inputs
  document.getElementById("zeshoesName").value = dayEvents.zeshoes || "";
  document.getElementById("lglName").value = dayEvents.lgl || "";

  // Btn supprimer visible si événements existants
  const deleteBtn = document.getElementById("deleteBtn");
  deleteBtn.style.display = (dayEvents.zeshoes || dayEvents.lgl) ? "block" : "none";

  document.getElementById("modal").classList.add("active");
  // Focus auto sur 1er champ après animation
  setTimeout(() => document.getElementById("zeshoesName").focus(), 100);
}

/**
 * Ferme le modal et reset selectedDate.
 */
function closeModal() {
  document.getElementById("modal").classList.remove("active");
  selectedDate = null;
}

/**
 * Sauvegarde les noms ZeShoes/LGL du modal dans events/localStorage.
 * Supprime si les 2 champs vides.
 */
function saveEvents() {
  if (!selectedDate) return;

  const dateKey = formatDateKey(selectedDate.year, selectedDate.month, selectedDate.day);
  const zeshoesName = document.getElementById("zeshoesName").value.trim();
  const lglName = document.getElementById("lglName").value.trim();

  if (zeshoesName || lglName) {
    // Créer/mettre à jour événements
    events[dateKey] = {};
    if (zeshoesName) events[dateKey].zeshoes = zeshoesName;
    if (lglName) events[dateKey].lgl = lglName;
  } else {
    // Supprimer si plus d'événements
    delete events[dateKey];
  }

  saveEventsToStorage();
  closeModal();
  renderCalendar();
  showNotification("Événements sauvegardés");
}

/**
 * Supprime complètement les événements d'une date.
 */
function deleteEvents() {
  if (!selectedDate) return;

  const dateKey = formatDateKey(selectedDate.year, selectedDate.month, selectedDate.day);
  delete events[dateKey];

  saveEventsToStorage();
  closeModal();
  renderCalendar();
  showNotification("Événements supprimés");
}

/**
 * Fermer modal en cliquant sur le backdrop (fond masqué).
 */
document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});

/**
 * Support tactile : swipe gauche/droite pour changer de mois.
 * Seuil 50px pour éviter détection accidentelle.
 */
let touchStartX = 0;
document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener("touchend", (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const diff = touchStartX - touchEndX;  // >0 = swipe gauche → mois suivant
  if (Math.abs(diff) > 50) {
    changeMonth(diff > 0 ? 1 : -1);
  }
}, false);

/**
 * Point d'entrée : lance l'initialisation complète.
 */
init();
