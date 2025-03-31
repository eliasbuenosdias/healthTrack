// Chart colors with better visual hierarchy
const chartColors = {
    weight: { color: '#4a6fa5', background: 'rgba(74, 111, 165, 0.1)' },
    bmi: { color: '#f39c12', background: 'rgba(243, 156, 18, 0.1)' },
    fatRate: { color: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)' },
    boneMass: { color: '#8e44ad', background: 'rgba(142, 68, 173, 0.1)' },
    metabolism: { color: '#16a085', background: 'rgba(22, 160, 133, 0.1)' },
    muscleRate: { color: '#27ae60', background: 'rgba(39, 174, 96, 0.1)' },
    visceralFat: { color: '#d35400', background: 'rgba(211, 84, 0, 0.1)' },
    bodyWaterRate: { color: '#3498db', background: 'rgba(52, 152, 219, 0.1)' },
    success: { color: '#28a745' }, // Añade un color para éxito
    danger: { color: '#dc3545' }      // Añade un color para peligro
};
// Metric titles and units for better readability
const metricInfo = {
    weight: { title: 'Peso Corporal', unit: 'kg', order: 1 },
    bmi: { title: 'Índice de Masa Corporal', unit: '', order: 2 },
    fatRate: { title: 'Porcentaje de Grasa Corporal', unit: '%', order: 3 },
    muscleRate: { title: 'Porcentaje de Músculo', unit: '%', order: 4 },
    visceralFat: { title: 'Grasa Visceral', unit: '', order: 5 },
    bodyWaterRate: { title: 'Porcentaje de Agua Corporal', unit: '%', order: 6 },
    boneMass: { title: 'Masa Ósea', unit: 'kg', order: 7 },
    metabolism: { title: 'Metabolismo Basal', unit: 'kcal', order: 8 }
};

let rawData = [];
let charts = {};

// DOM Elements
const fileInput = document.getElementById('fileInput');
const filterSelect = document.getElementById('filter');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const updateButton = document.getElementById('updateButton');
const chartsContainer = document.getElementById('chartsContainer');
const dateRangeInfo = document.getElementById('dateRangeInfo');
const latestDataContainer = document.getElementById('latestDataContainer');

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
updateButton.addEventListener('click', updateCharts);
filterSelect.addEventListener('change', handleFilterChange);

// Handle filter type change
function handleFilterChange() {
    const isCustom = filterSelect.value === 'custom';
    startDateInput.style.display = isCustom ? 'block' : 'none';
    endDateInput.style.display = isCustom ? 'block' : 'none';

    if (!isCustom && rawData.length > 0) {
        updateCharts();
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            rawData = parseCSV(e.target.result);
            if (rawData.length > 0) {
                updateCharts();
            } else {
                alert("No se pudieron procesar datos válidos del archivo CSV.");
                dateRangeInfo.textContent = "No hay datos válidos en el archivo";
            }
        } catch (error) {
            console.error("Error processing CSV:", error);
            alert("Error al procesar el archivo CSV: " + error.message);
            dateRangeInfo.textContent = "Error al procesar el archivo";
        }
    };
    reader.readAsText(file);
}

// Parse CSV data
function parseCSV(csv) {
    const lines = csv.split('\n');

    // Skip empty lines
    return lines.filter(line => line.trim() !== '')
        .map(line => {
            const values = line.split(',').map(v => v.trim());
            if (values.length < 10) return null; // Skip incomplete lines

            // Check if this is a header row
            if (isNaN(parseFloat(values[1]))) return null;

            const [time, weight, height, bmi, fatRate, bodyWaterRate, boneMass, metabolism, muscleRate, visceralFat] = values;

            return {
                time: new Date(time),
                weight: parseFloat(weight),
                height: parseFloat(height),
                bmi: parseFloat(bmi),
                fatRate: parseFloat(fatRate),
                bodyWaterRate: parseFloat(bodyWaterRate),
                boneMass: parseFloat(boneMass),
                metabolism: parseFloat(metabolism),
                muscleRate: parseFloat(muscleRate),
                visceralFat: parseFloat(visceralFat)
            };
        })
        .filter(entry => entry && !isNaN(entry.time) && !isNaN(entry.weight));
}

// Filter data based on selected time range
function filterData() {
    const filterType = filterSelect.value;
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    endDate.setHours(23, 59, 59); // Include the entire end day

    const now = new Date();
    let filteredData;

    switch (filterType) {
        case 'weekly':
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            filteredData = rawData.filter(d => d.time >= weekAgo);
            break;

        case 'monthly':
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            filteredData = rawData.filter(d => d.time >= monthAgo);
            break;

        case 'yearly':
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            filteredData = rawData.filter(d => d.time >= yearAgo);
            break;

        case 'custom':
            if (!isNaN(startDate) && !isNaN(endDate)) {
                filteredData = rawData.filter(d => d.time >= startDate && d.time <= endDate);
            } else {
                filteredData = rawData;
            }
            break;

        default: // 'all'
            filteredData = [...rawData];
    }

    // Sort by date
    return filteredData.sort((a, b) => a.time - b.time);
}

// Function to create a single chart
function createChart(metric, labels, metricData, container) {
    console.log("Métrica actual:", metric);
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    chartWrapper.id = `chart-wrapper-${metric}`;

    const chartTitle = document.createElement('div');
    chartTitle.className = 'chart-title';
    chartTitle.textContent = metricInfo[metric].title;

    const canvas = document.createElement('canvas');
    canvas.id = metric + 'Chart';

    const controls = document.createElement('div');
    controls.className = 'chart-controls';
    const typeSelect = document.createElement('select');
    const lineOption = document.createElement('option');
    lineOption.value = 'line';
    lineOption.textContent = 'Líneas';
    const barOption = document.createElement('option');
    barOption.value = 'bar';
    barOption.textContent = 'Barras';
    typeSelect.appendChild(lineOption);
    typeSelect.appendChild(barOption);
    typeSelect.value = 'line'; // Default chart type
    controls.appendChild(typeSelect);

    chartWrapper.appendChild(chartTitle);
    chartWrapper.appendChild(canvas);
    chartWrapper.appendChild(controls);
    container.appendChild(chartWrapper);

    const ctx = canvas.getContext('2d');
    let currentChartType = 'line';
    let chartInstance;

    function renderChart(type) {
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: metricInfo[metric].title + (metricInfo[metric].unit ? ` ${metricInfo[metric].unit}` : ''),
                    data: metricData,
                    borderColor: chartColors[metric].color,
                    backgroundColor: type === 'bar' ? chartColors[metric].color : chartColors[metric].background,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.2,
                    fill: type === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: metric === 'visceralFat' ? true : false,
                        suggestedMin: getMinValue(metricData, 0.9),
                        suggestedMax: getMaxValue(metricData, 1.1)
                    }
                }
            }
        });
    }

    typeSelect.addEventListener('change', (event) => {
        currentChartType = event.target.value;
        renderChart(currentChartType);
    });

    renderChart(currentChartType); // Initial rendering
}

// Create or update charts
function updateCharts() {
    const data = filterData();
    if (data.length === 0) {
        alert("No hay datos disponibles para el período seleccionado");
        dateRangeInfo.textContent = "No hay datos para el período seleccionado";
        chartsContainer.innerHTML = ''; // Clear previous charts
        latestDataContainer.innerHTML = ''; // Clear latest data
        return;
    }

    const labels = data.map(d => {
        const date = new Date(d.time);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    });

    const selectedMetrics = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(cb => cb.value)
        .sort((a, b) => metricInfo[a].order - metricInfo[b].order);

    chartsContainer.innerHTML = ''; // Clear previous charts
    latestDataContainer.innerHTML = ''; // Clear previous latest data

    // Display latest measurement
    if (data.length > 0) {
        const latestDataPoint = data[data.length - 1];
        selectedMetrics.forEach(metric => {
            const value = latestDataPoint[metric];
            const unitText = metricInfo[metric].unit ? ` ${metricInfo[metric].unit}` : '';
            const itemDiv = document.createElement('div');
            itemDiv.className = 'latest-data-item';
            itemDiv.innerHTML = `<h4>${metricInfo[metric].title}</h4><p>${value.toFixed(1)}${unitText}</p>`;
            latestDataContainer.appendChild(itemDiv);
        });
    }

    selectedMetrics.forEach(metric => {
        const metricData = data.map(d => d[metric]);
        createChart(metric, labels, metricData, chartsContainer);
    });

    // Add percentage progress chart
    if (data.length > 1) {
        const progressChartWrapper = document.createElement('div');
        progressChartWrapper.className = 'progress-chart-wrapper';
        const progressChartTitle = document.createElement('div');
        progressChartTitle.className = 'progress-chart-title';
        progressChartTitle.textContent = 'Progreso (%)';
        const progressCanvas = document.createElement('canvas');
        progressCanvas.id = 'progressChart';
        progressChartWrapper.appendChild(progressChartTitle);
        progressChartWrapper.appendChild(progressCanvas);
        chartsContainer.appendChild(progressChartWrapper);

        const progressCtx = progressCanvas.getContext('2d');
        const progressLabels = selectedMetrics.map(metric => metricInfo[metric].title);
        const progressData = selectedMetrics.map(metric => {
            const firstValue = data[0][metric];
            const lastValue = data[data.length - 1][metric];
            if (firstValue === 0) return 0; // Avoid division by zero
            return ((lastValue - firstValue) / firstValue) * 100;
        });
        const backgroundColors = progressData.map(progress => progress >= 0 ? chartColors.success.color : chartColors.danger.color);

        new Chart(progressCtx, {
            type: 'bar',
            data: {
                labels: progressLabels,
                datasets: [{
                    label: 'Cambio (%)',
                    data: progressData,
                    backgroundColor: backgroundColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { title: { display: true, text: 'Porcentaje' } }
                }
            }
        });
    }

    updateDateRangeSummary(data);
    chartsContainer.scrollTop = 0;
}

// Calculate min/max values
function getMinValue(data, factor) {
    const min = Math.min(...data);
    return min * factor;
}

function getMaxValue(data, factor) {
    const max = Math.max(...data);
    return max * factor;
}

// Display date range summary
function updateDateRangeSummary(data) {
    if (data.length === 0) return;

    const firstDate = new Date(data[0].time);
    const lastDate = new Date(data[data.length - 1].time);

    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const firstDateStr = firstDate.toLocaleDateString('es-ES', dateOptions);
    const lastDateStr = lastDate.toLocaleDateString('es-ES', dateOptions);

    dateRangeInfo.textContent = `Mostrando datos desde ${firstDateStr} hasta ${lastDateStr} (${data.length} mediciones)`;
}

// Initialize date inputs
function initializeDateInputs() {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    endDateInput.valueAsDate = today;
    startDateInput.valueAsDate = lastYear;

    // Initially hide date inputs unless custom filter is selected
    handleFilterChange();
}

// Initialize on page load
window.onload = function() {
    initializeDateInputs();

    // Check if user has previously uploaded data (for demo purposes)
    if (localStorage.getItem('hasData') === 'true') {
        dateRangeInfo.textContent = "Selecciona un archivo CSV para comenzar";
    }
};