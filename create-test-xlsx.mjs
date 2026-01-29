import XLSX from 'xlsx';

const data = [
  {
    Marca: 'MICHELIN',
    Modelo: 'PRIMACY 4',
    Medida: '205/55R16',
    Costo: 1500.00,
    Stock: 4,
    'Índice': '91V',
    SKU: 'MICH-2055516'
  },
  {
    Marca: 'PIRELLI',
    Modelo: 'CINTURATO P7',
    Medida: '225/45-17',
    Costo: 1800.00,
    Stock: 6,
    'Índice': '94W',
    SKU: 'PIRE-2254517'
  },
  {
    Marca: 'GOODYEAR',
    Modelo: 'EAGLE F1',
    Medida: '255 35 R19',
    Costo: 2200.00,
    Stock: 2,
    'Índice': '98Y',
    SKU: 'GOOD-2553519'
  }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
XLSX.writeFile(wb, '/tmp/test-inventory.xlsx');
console.log('✅ Archivo de test creado: /tmp/test-inventory.xlsx');
