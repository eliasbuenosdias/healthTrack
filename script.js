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
// Metric titles and units for better readability (can be empty now)
const metricInfo = {};

let rawData = [];
let latestDateInData;
let charts = {};
let csvHeader = [];

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
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');
        if (lines.length > 0) {
            csvHeader = lines[0].split(',').map(header => header.trim());
            const dataLines = lines.slice(1);
            rawData = parseCSV(dataLines.join('\n'), csvHeader);
            if (rawData.length > 0) {
                // Determine the latest date in the data
                latestDateInData = rawData.reduce((maxDate, current) => {
                    return current.time > maxDate ? current.time : maxDate;
                }, new Date(0)); // Initialize with a very early date

                updateCharts(csvHeader);
            } else {
                alert("No se pudieron procesar datos válidos del archivo CSV.");
                dateRangeInfo.textContent = "No hay datos válidos en el archivo";
                latestDateInData = null;
            }
        } else {
            alert("El archivo CSV está vacío.");
            dateRangeInfo.textContent = "El archivo CSV está vacío";
            latestDateInData = null;
        }
    };
    reader.readAsText(file);
}

// Parse CSV data
function parseCSV(csv, header) {
    const lines = csv.split('\n');
    return lines.filter(line => line.trim() !== '')
        .map(line => {
            const values = line.split(',').map(v => v.trim());
            if (values.length !== header.length) return null;

            const entry = {};
            let timeIndex = -1;
            header.forEach((col, index) => {
                if (col.toLowerCase() === 'time') {
                    timeIndex = index;
                    const parsedTime = new Date(values[index]);
                    entry['time'] = isNaN(parsedTime) ? null : parsedTime;
                } else {
                    const numValue = parseFloat(values[index]);
                    entry[col] = isNaN(numValue) ? values[index] : numValue;
                }
            });
            return entry.time === null ? null : entry;
        })
        .filter(entry => entry && !isNaN(entry.time));
}

// Filter data based on selected time range
function filterData() {
    const filterType = filterSelect.value;
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    endDate.setHours(23, 59, 59);

    let filteredData;

    if (!latestDateInData) {
        return []; // No data loaded yet
    }

    switch (filterType) {
        case 'weekly':
            const weekAgo = new Date(latestDateInData);
            weekAgo.setDate(latestDateInData.getDate() - 7);
            filteredData = rawData.filter(d => d.time >= weekAgo && d.time <= latestDateInData);
            break;

        case 'monthly':
            const monthAgo = new Date(latestDateInData);
            monthAgo.setMonth(latestDateInData.getMonth() - 1);
            filteredData = rawData.filter(d => d.time >= monthAgo && d.time <= latestDateInData);
            break;

        case 'yearly':
            const yearAgo = new Date(latestDateInData);
            yearAgo.setFullYear(latestDateInData.getFullYear() - 1);
            filteredData = rawData.filter(d => d.time >= yearAgo && d.time <= latestDateInData);
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

    return filteredData.sort((a, b) => a.time - b.time);
}

// Function to create a single chart
function createChart(metric, labels, metricData, container) {
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    chartWrapper.id = `chart-wrapper-${metric}`;

    const chartTitle = document.createElement('div');
    chartTitle.className = 'chart-title';
    chartTitle.textContent = metric; // Use the metric name from the header

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

        const metricColor = chartColors[metric.toLowerCase()] || { color: '#777', background: 'rgba(119, 119, 119, 0.1)' };

        chartInstance = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: metric,
                    data: metricData,
                    borderColor: metricColor.color,
                    backgroundColor: type === 'bar' ? metricColor.color : metricColor.background,
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
                        beginAtZero: metric.toLowerCase().includes('fat') || metric.toLowerCase().includes('visceral') ? true : false,
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
function updateCharts(header) {
    if (!latestDateInData) {
        alert("Por favor, carga un archivo CSV primero.");
        return;
    }

    const data = filterData();
    if (data.length === 0) {
        alert("No hay datos disponibles para el período seleccionado");
        dateRangeInfo.textContent = "No hay datos para el período seleccionado";
        chartsContainer.innerHTML = '';
        latestDataContainer.innerHTML = '';
        return;
    }

    const labels = data.map(d => {
        const date = new Date(d.time);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    });

    const selectedMetrics = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(cb => cb.value);

    chartsContainer.innerHTML = '';
    latestDataContainer.innerHTML = '';

    // Display the absolute latest measurement from the raw data
    if (rawData.length > 0) {
        const absoluteLatestDataPoint = rawData.reduce((latest, current) => {
            return current.time > latest.time ? current : latest;
        });
        latestDataContainer.innerHTML = '<h4>Último Dato Insertado</h4>';
        header.forEach(columnName => {
            if (columnName.toLowerCase() !== 'time') {
                const value = absoluteLatestDataPoint[columnName];
                const unit = metricInfo[columnName.toLowerCase()]?.unit || '';
                const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
                if (formattedValue !== undefined && formattedValue !== null) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'latest-data-item';
                    itemDiv.innerHTML = `<p><strong>${columnName}:</strong> ${formattedValue}${unit ? ` ${unit}` : ''}</p>`;
                    latestDataContainer.appendChild(itemDiv);
                }
            }
        });
    }

    selectedMetrics.forEach(metric => {
        if (header.includes(metric)) {
            const metricData = data.map(d => d[metric]);
            createChart(metric, labels, metricData, chartsContainer);
        }
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
        const progressLabels = selectedMetrics.filter(metric => header.includes(metric));
        const progressData = progressLabels.map(metric => {
            const firstValue = data[0][metric];
            const lastValue = data[data.length - 1][metric];
            if (typeof firstValue === 'number' && typeof lastValue === 'number' && firstValue !== 0) {
                return ((lastValue - firstValue) / firstValue) * 100;
            }
            return NaN;
        });
        const backgroundColors = progressData.map(progress => !isNaN(progress) && progress >= 0 ? chartColors.success.color : chartColors.danger.color);

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
    const validData = data.filter(value => typeof value === 'number');
    if (validData.length === 0) return 0;
    const min = Math.min(...validData);
    return isFinite(min) ? min * factor : 0;
}

function getMaxValue(data, factor) {
    const validData = data.filter(value => typeof value === 'number');
    if (validData.length === 0) return 1;
    const max = Math.max(...validData);
    return isFinite(max) ? max * factor : 1;
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

    handleFilterChange();
}

// Initialize on page load
window.onload = function() {
    initializeDateInputs();

    if (localStorage.getItem('hasData') === 'true') {
        dateRangeInfo.textContent = "Selecciona un archivo CSV para comenzar";
    }
};
