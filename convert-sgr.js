import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertSgrToJson() {
    // Читаем файл СГР.xlsx
    const filePath = path.join(__dirname, 'src/assets/СГР.xlsx');
    const workbook = XLSX.readFile(filePath);
    
    // Получаем лист с данными (Лист1)
    const worksheet = workbook.Sheets['Лист1'];
    
    // Конвертируем в JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false
    });
    
    if (data.length === 0) {
        console.log('Файл пустой или не удалось прочитать данные');
        return;
    }
    
    // Вторая строка содержит заголовки
    const headers = data[1];
    console.log('Заголовки:', headers);
    
    // Находим индексы нужных колонок
    const statusIndex = headers.findIndex(h => h && h.toLowerCase().includes('статус'));
    const categoryColumns = [];
    
    // Ищем все колонки с категориями (Категория 1, Категория 2, и т.д.)
    headers.forEach((header, index) => {
        if (header && header.toLowerCase().includes('категория')) {
            categoryColumns.push(index);
        }
    });
    
    console.log('Индекс колонки статуса:', statusIndex);
    console.log('Индексы колонок категорий:', categoryColumns);
    
    // Обрабатываем данные начиная с третьей строки (индекс 2)
    const processedData = [];
    
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        
        // Пропускаем пустые строки
        if (!row || row.every(cell => !cell)) continue;
        
        // Проверяем статус
        const status = row[statusIndex];
        if (!status || !status.toLowerCase().includes('подписан и действует')) {
            continue;
        }
        
        // Собираем категории в массив
        const categories = categoryColumns
            .map(index => row[index])
            .filter(category => category && category.trim() !== '');
        
        // Создаем объект для фронтенда
        const item = {};
        
        headers.forEach((header, index) => {
            if (!header) return;
            
            // Пропускаем колонки категорий (они уже в массиве categories)
            if (categoryColumns.includes(index)) return;
            
            const value = row[index];
            if (value !== undefined && value !== null && value !== '') {
                // Преобразуем названия полей в удобный формат для фронтенда
                let fieldName;
                switch (header.toLowerCase()) {
                    case 'номер свидетельства':
                        fieldName = 'certificateNumber';
                        break;
                    case 'дата свидетельства':
                        fieldName = 'certificateDate';
                        break;
                    case 'наименование продукции':
                        fieldName = 'productName';
                        break;
                    case 'форма выпуска':
                        fieldName = 'releaseForm';
                        break;
                    case 'изготовитель':
                        fieldName = 'manufacturer';
                        break;
                    case 'получатель':
                        fieldName = 'recipient';
                        break;
                    case 'область применения':
                        fieldName = 'applicationArea';
                        break;
                    case 'состав':
                        fieldName = 'composition';
                        break;
                    case 'активные вещества':
                        fieldName = 'activeSubstances';
                        break;
                    case 'приём, рекомендации по применению':
                        fieldName = 'usageRecommendations';
                        break;
                    case 'статус':
                        fieldName = 'status';
                        break;
                    case 'есть в до':
                        fieldName = 'inDO';
                        break;
                    default:
                        fieldName = header
                            .toLowerCase()
                            .replace(/[^a-zа-я0-9\s]/g, '') // убираем спецсимволы
                            .replace(/\s+/g, '_') // пробелы в подчеркивания
                            .replace(/^(\d)/, '_$1'); // если начинается с цифры, добавляем подчеркивание
                }
                
                item[fieldName] = value;
            }
        });
        
        // Добавляем массив категорий
        item.categories = categories;
        
        processedData.push(item);
    }
    
    console.log(`\nОбработано ${processedData.length} записей со статусом "подписан и действует"`);
    
    // Записываем результат в JSON файл
    const outputPath = path.join(__dirname, 'sgr-converted.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf8');
    
    console.log(`\nДанные сохранены в файл: ${outputPath}`);
    
    // Показываем пример первых записей
    if (processedData.length > 0) {
        console.log('\nПример первой записи:');
        console.log(JSON.stringify(processedData[0], null, 2));
        
        console.log(`\nСтатистика по категориям в первых 10 записях:`);
        processedData.slice(0, 10).forEach((item, index) => {
            console.log(`${index + 1}. ${item.productName?.substring(0, 50)}... - категории: ${item.categories.length}`);
        });
    }
    
    return processedData;
}

// Запускаем конвертацию
try {
    convertSgrToJson();
} catch (error) {
    console.error('Ошибка при конвертации файла:', error.message);
    console.log('\nУстановите зависимость xlsx командой: npm install xlsx');
} 