export const numberToWords = (num: number): string => {
  const unidades = ['CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas2 = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num < 10) return unidades[num];
  if (num < 20) return decenas[num - 10];
  if (num < 30) return 'VEINTI' + unidades[num - 20];
  if (num < 100) {
    const decena = Math.floor(num / 10);
    const unidad = num % 10;
    return unidad ? `${decenas2[decena]} Y ${unidades[unidad]}` : decenas2[decena];
  }
  if (num < 1000) {
    const centena = Math.floor(num / 100);
    const resto = num % 100;
    if (num === 100) return 'CIEN';
    return resto ? `${centenas[centena - 1]} ${numberToWords(resto)}` : centenas[centena - 1];
  }
  return num.toString().toUpperCase();
};
