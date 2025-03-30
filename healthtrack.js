// Variables globales
let allData = [];
let filteredData = [];
let weightChart, bmiChart, fatRateChart, muscleRateChart, waterRateChart, 
    metabolismChart, visceralFatChart, boneMassChart;
let currentFilterType = 'all';
let customStartDate = null;
let customEndDate = null;

// Configuración para los rangos de salud (valores de ejemplo)
const healthRanges = {
    bmi: { min: 18.5, max: 24.9 },
    fatRate: { min: 10, max: 20 },
    muscleRate: { min: 40, max: 60 },
    bodyWaterRate: { min: 50, max: 65 },
    visceralFat: { min: 1, max: 9 }
};

// Función que se ejecuta cuando la página haya cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencia a los elementos del DOM
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const mainContent = document.getElementById('mainContent');
    const presetFilters = document.querySelectorAll('.preset-filter');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyCustomFilterBtn = document.getElementById('applyCustomFilter');
    const dateRangeDisplay = document.getElementById('dateRangeDisplay');
    const csvFileInput = document.getElementById('csvFileInput');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const dataSection = document.getElementById('data-section');

    // Toggle Sidebar
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });

    // Preset Filters
    presetFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            applyFilter(filterType);
            
            // Actualizar UI - mostrar filtro activo
            presetFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar el texto del rango de fechas
            updateDateRangeDisplay(filterType);
        });
    });

    // Custom Date Filter
    applyCustomFilterBtn.addEventListener('click', () => {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (startDate && endDate) {
            customStartDate = startDate;
            customEndDate = endDate;
            applyFilter('custom');
            
            // Actualizar UI
            presetFilters.forEach(f => f.classList.remove('active'));
            document.querySelector('[data-filter="custom"]').classList.add('active');
            
            // Actualizar el texto del rango de fechas
            updateDateRangeDisplay('custom');
        }
    });

    // Cargar datos desde CSV
    loadDataBtn.addEventListener('click', () => {
        const file = csvFileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                parseVerticalCSV(content);
                if (allData.length > 0) {
                    initializeCharts();
                    applyFilter('all');
                    document.querySelector('[data-filter="all"]').classList.add('active');
                    updateDateRangeDisplay('all');
                    dataSection.style.display = 'block';
                }
            };
            reader.readAsText(file);
        }
    });
});

// Función para analizar CSV en formato vertical
function parseVerticalCSV(content) {
    const lines = content.trim().split('\n');
    const headers = [];
    const values = [];
    
    let headerSection = true;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Si encontramos una línea que parece una fecha con formato completo (YYYY-MM-DD HH:MM:SS+ZZZZ)
        if (line.match(/^\*?\*?\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\+\d{4}\*?\*?$/)) {
            headerSection = false;
        }
        
        if (headerSection) {
            // Si la línea no está vacía y no es solo asteriscos, la consideramos un encabezado
            if (line && !line.match(/^\*\*\s*\*\*$/)) {
                headers.push(line.replace(/\*\*/g, '').trim());
            }
        } else {
            // Recolectamos valores
            values.push(line.replace(/\*\*/g, '').trim());
        }
    }
    
    // Si tenemos headers y values, creamos un objeto de datos
    if (headers.length > 0 && values.length > 0) {
        const dataPoint = {};
        
        // Asumimos que los valores están en el mismo orden que los encabezados
        for (let i = 0; i < Math.min(headers.length, values.length); i++) {
            // Limpiamos posibles asteriscos y espacios
            const header = headers[i].replace(/\*\*/g, '').trim();
            const value = values[i].replace(/\*\*/g, '').trim();
            
            // Conversión especial para la fecha con formato específico
            if (header === 'time') {
                try {
                    // Para el formato "2020-01-31 16:36:09+0000"
                    dataPoint[header] = new Date(value);
                    
                    // Verificamos si la fecha es válida
                    if (isNaN(dataPoint[header].getTime())) {
                        console.error("Error en formato de fecha:", value);
                        // Si hay error, intentamos un formato alternativo o dejamos el valor como string
                        dataPoint[header] = value;
                    }
                } catch (e) {
                    console.error("Error al parsear fecha:", e);
                    dataPoint[header] = value;
                }
            } else {
                // Para valores numéricos
                const numValue = parseFloat(value);
                dataPoint[header] = !isNaN(numValue) ? numValue : value;
            }
        }
        
        // Validación básica: asegurarnos de que el punto de datos tiene al menos las propiedades esenciales
        if (dataPoint.time && dataPoint.weight) {
            // Añadimos el punto de datos a nuestro conjunto global
            allData = [dataPoint];
            console.log("Datos cargados:", allData);
        } else {
            console.error("Datos incompletos o inválidos:", dataPoint);
        }
    }
}

// Función para aplicar filtros de fecha
function applyFilter(filterType) {
    currentFilterType = filterType;
    const now = new Date();
    
    switch(filterType) {
        case 'week':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            filteredData = allData.filter(item => {
                const itemDate = item.time instanceof Date ? item.time : new Date(item.time);
                return itemDate >= oneWeekAgo;
            });
            break;
        case 'month':
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            filteredData = allData.filter(item => {
                const itemDate = item.time instanceof Date ? item.time : new Date(item.time);
                return itemDate >= oneMonthAgo;
            });
            break;
        case 'year':
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            filteredData = allData.filter(item => {
                const itemDate = item.time instanceof Date ? item.time : new Date(item.time);
                return itemDate >= oneYearAgo;
            });
            break;
        case 'custom':
            if (customStartDate && customEndDate) {
                filteredData = allData.filter(item => {
                    const itemDate = item.time instanceof Date ? item.time : new Date(item.time);
                    return itemDate >= customStartDate && itemDate <= customEndDate;
                });
            }
            break;
        case 'all':
        default:
            filteredData = [...allData];
            break;
    }
    
    updateCharts();
}

// Actualizar la visualización del rango de fechas
function updateDateRangeDisplay(filterType) {
    const dateRangeDisplay = document.getElementById('dateRangeDisplay');
    const now = new Date();
    let text = '';
    
    switch(filterType) {
        case 'week':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            text = `Datos de la última semana (${formatDate(oneWeekAgo)} - ${formatDate(now)})`;
            break;
        case 'month':
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            text = `Datos del último mes (${formatDate(oneMonthAgo)} - ${formatDate(now)})`;
            break;
        case 'year':
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            text = `Datos del último año (${formatDate(oneYearAgo)} - ${formatDate(now)})`;
            break;
        case 'custom':
            if (customStartDate && customEndDate) {
                text = `Rango personalizado (${formatDate(customStartDate)} - ${formatDate(customEndDate)})`;
            } else {
                text = 'Rango personalizado (seleccione fechas)';
            }
            break;
        case 'all':
        default:
            if (allData.length > 0) {
                const dates = allData.map(item => {
                    return item.time instanceof Date ? item.time : new Date(item.time);
                });
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                text = `Todos los datos (${formatDate(minDate)} - ${formatDate(maxDate)})`;
            } else {
                text = 'Todos los datos';
            }
            break;
    }
    
    dateRangeDisplay.textContent = text;
}

// Formatear la fecha para mostrar
function formatDate(date) {
    return date.toLocaleDateString();
}

// Inicializar gráficos
function initializeCharts() {
    const ctx = {
        weight: document.getElementById('weightChart').getContext('2d'),
        bmi: document.getElementById('bmiChart').getContext('2d'),
        fatRate: document.getElementById('fatRateChart').getContext('2d'),
        muscleRate: document.getElementById('muscleRateChart').getContext('2d'),
        waterRate: document.getElementById('waterRateChart').getContext('2d'),
        metabolism: document.getElementById('metabolismChart').getContext('2d'),
        visceralFat: document.getElementById('visceralFatChart').getContext('2d'),
        boneMass: document.getElementById('boneMassChart').getContext('2d')
    };
    
    // Configuración común para todos los gráficos
    const commonConfig = {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    };
    
    // Crear gráficos con la configuración específica para cada uno
    weightChart = createChart(ctx.weight, 'Peso (kg)', 'weight', commonConfig, null);
    bmiChart = createChart(ctx.bmi, 'IMC', 'bmi', commonConfig, healthRanges.bmi);
    fatRateChart = createChart(ctx.fatRate, 'Grasa Corporal (%)', 'fatRate', commonConfig, healthRanges.fatRate);
    muscleRateChart = createChart(ctx.muscleRate, 'Masa Muscular (%)', 'muscleRate', commonConfig, healthRanges.muscleRate);
    waterRateChart = createChart(ctx.waterRate, 'Agua Corporal (%)', 'bodyWaterRate', commonConfig, healthRanges.bodyWaterRate);
    metabolismChart = createChart(ctx.metabolism, 'Metabolismo (kcal)', 'metabolism', commonConfig, null);
    visceralFatChart = createChart(ctx.visceralFat, 'Grasa Visceral', 'visceralFat', commonConfig, healthRanges.visceralFat);
    boneMassChart = createChart(ctx.boneMass, 'Masa Ósea (kg)', 'boneMass', commonConfig, null);
}

// Crear un gráfico específico
function createChart(ctx, label, dataKey, commonConfig, healthRange) {
    const config = JSON.parse(JSON.stringify(commonConfig)); // Clonar configuración
    
    config.data = {
        labels: filteredData.map(item => item.time),
        datasets: [{
            label: label,
            data: filteredData.map(item => ({ x: item.time, y: item[dataKey] })),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true
        }]
    };
    
    // Si hay un rango de salud, añadir líneas para el min y max
    if (healthRange) {
        // Línea para el valor mínimo saludable
        config.data.datasets.push({
            label: 'Mínimo saludable',
            data: filteredData.map(item => ({ x: item.time, y: healthRange.min })),
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });
        
        // Línea para el valor máximo saludable
        config.data.datasets.push({
            label: 'Máximo saludable',
            data: filteredData.map(item => ({ x: item.time, y: healthRange.max })),
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });
    }
    
    return new Chart(ctx, config);
}

// Actualizar los gráficos con datos filtrados
function updateCharts() {
    const charts = [
        { chart: weightChart, key: 'weight' },
        { chart: bmiChart, key: 'bmi' },
        { chart: fatRateChart, key: 'fatRate' },
        { chart: muscleRateChart, key: 'muscleRate' },
        { chart: waterRateChart, key: 'bodyWaterRate' },
        { chart: metabolismChart, key: 'metabolism' },
        { chart: visceralFatChart, key: 'visceralFat' },
        { chart: boneMassChart, key: 'boneMass' }
    ];
    
    charts.forEach(item => {
        if (item.chart) {
            // Actualizar datos
            item.chart.data.labels = filteredData.map(d => d.time);
            item.chart.data.datasets[0].data = filteredData.map(d => ({ x: d.time, y: d[item.key] }));
            
            // Si hay rangos de salud (datasets adicionales), actualizar también
            if (item.chart.data.datasets.length > 1) {
                item.chart.data.datasets[1].data = filteredData.map(d => ({ x: d.time, y: item.chart.data.datasets[1].data[0].y }));
                item.chart.data.datasets[2].data = filteredData.map(d => ({ x: d.time, y: item.chart.data.datasets[2].data[0].y }));
            }
            
            item.chart.update();
        }
    });
    
    // Actualizar estadísticas
    updateStatistics();
}

// Actualizar estadísticas basadas en los datos filtrados
function updateStatistics() {
    // Si no hay datos, no hacer nada
    if (filteredData.length === 0) return;
    
    const stats = {
        weight: calculateStats(filteredData.map(item => item.weight)),
        bmi: calculateStats(filteredData.map(item => item.bmi)),
        fatRate: calculateStats(filteredData.map(item => item.fatRate)),
        muscleRate: calculateStats(filteredData.map(item => item.muscleRate)),
        bodyWaterRate: calculateStats(filteredData.map(item => item.bodyWaterRate)),
        metabolism: calculateStats(filteredData.map(item => item.metabolism)),
        visceralFat: calculateStats(filteredData.map(item => item.visceralFat)),
        boneMass: calculateStats(filteredData.map(item => item.boneMass))
    };
    
    // Actualizar los elementos HTML con estas estadísticas
    for (const [key, value] of Object.entries(stats)) {
        const avgElement = document.getElementById(`${key}Avg`);
        const minElement = document.getElementById(`${key}Min`);
        const maxElement = document.getElementById(`${key}Max`);
        
        if (avgElement) avgElement.textContent = value.avg.toFixed(1);
        if (minElement) minElement.textContent = value.min.toFixed(1);
        if (maxElement) maxElement.textContent = value.max.toFixed(1);
    }
}

// Calcular estadísticas básicas para un conjunto de datos
function calculateStats(data) {
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    return { avg, min, max };
}