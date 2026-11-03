import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  RefreshCw,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { ApiClient, type LiveRates, type CurrencyItem, type RealChartResult } from '../api/client';
import { pluralize } from '../utils/plural';

interface RatesViewProps {
  ratesData?: LiveRates | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

type Timeframe = '1D' | '1W' | '1M' | '1Y';
type CategoryFilter = 'all' | 'ton' | 'crypto' | 'fiat';

// Резервный каталог популярных валют, если данные еще грузятся
const fallbackItems: CurrencyItem[] = [
  {
    id: 'USDT/RUB',
    name: 'Tether (СБП)',
    symbol: 'USDT',
    pair: 'USDT / RUB',
    price: 81.1,
    priceFormatted: '81.10 ₽',
    change24h: '+0.46%',
    isPositive: true,
    category: 'fiat',
    tag: 'СБП РФ (НСПК)',
    icon: '💵',
    sub: 'Шлюз оплат в рублях без 115-ФЗ',
    history: {
      '1D': [80.7, 80.85, 80.9, 81.0, 81.15, 81.05, 81.1, 81.1],
      '1W': [80.2, 80.4, 80.6, 80.9, 80.8, 81.0, 81.1],
      '1M': [78.5, 79.1, 79.8, 80.2, 80.6, 80.9, 81.1],
      '1Y': [72.0, 75.4, 78.2, 82.0, 84.5, 83.1, 81.1],
    },
  },
  {
    id: 'TON/USD',
    name: 'Toncoin',
    symbol: 'TON',
    pair: 'TON / USD',
    price: 1.168,
    priceFormatted: '$1.168',
    change24h: '−2.41%',
    isPositive: false,
    category: 'ton',
    tag: 'TON Core L1',
    icon: '💎',
    sub: 'Нативная монета блокчейна TON',
    history: {
      '1D': [1.198, 1.192, 1.185, 1.179, 1.172, 1.169, 1.168],
      '1W': [1.22, 1.21, 1.19, 1.18, 1.17, 1.165, 1.168],
      '1M': [1.45, 1.40, 1.35, 1.28, 1.22, 1.18, 1.168],
      '1Y': [2.15, 2.50, 2.80, 2.20, 1.80, 1.40, 1.168],
    },
  },
  {
    id: 'BTC/USDT',
    name: 'Bitcoin',
    symbol: 'BTC',
    pair: 'BTC / USDT',
    price: 77300,
    priceFormatted: '$77,300.00',
    change24h: '+1.20%',
    isPositive: true,
    category: 'crypto',
    tag: 'Главная крипта',
    icon: '₿',
    sub: 'Первая криптовалюта мира',
    history: {
      '1D': [76400, 76650, 76900, 77100, 77250, 77300],
      '1W': [74500, 75100, 75800, 76200, 76900, 77300],
      '1M': [68200, 70100, 72500, 74200, 76000, 77300],
      '1Y': [42000, 52000, 64000, 68000, 72000, 77300],
    },
  },
  {
    id: 'ETH/USDT',
    name: 'Ethereum',
    symbol: 'ETH',
    pair: 'ETH / USDT',
    price: 2285,
    priceFormatted: '$2,285.00',
    change24h: '−0.35%',
    isPositive: false,
    category: 'crypto',
    tag: 'Смарт-контракты',
    icon: 'Ξ',
    sub: 'Экосистема децентрализованных финансов',
    history: {
      '1D': [2295, 2290, 2282, 2288, 2285],
      '1W': [2240, 2260, 2275, 2290, 2285],
      '1M': [2100, 2180, 2220, 2270, 2285],
      '1Y': [1800, 2400, 3100, 2700, 2400, 2285],
    },
  },
  {
    id: 'SOL/USDT',
    name: 'Solana',
    symbol: 'SOL',
    pair: 'SOL / USDT',
    price: 93.1,
    priceFormatted: '$93.10',
    change24h: '−1.40%',
    isPositive: false,
    category: 'crypto',
    tag: 'Быстрый блокчейн',
    icon: '◎',
    sub: 'Высокоскоростная сеть Solana',
    history: {
      '1D': [94.5, 94.1, 93.8, 93.4, 93.1],
      '1W': [89.0, 91.2, 92.5, 94.0, 93.1],
      '1M': [82.0, 85.0, 89.0, 92.0, 93.1],
      '1Y': [45.0, 65.0, 110.0, 130.0, 93.1],
    },
  },
  {
    id: 'TON/RUB',
    name: 'Toncoin в рублях',
    symbol: 'TON',
    pair: 'TON / RUB',
    price: 94.8,
    priceFormatted: '94.80 ₽',
    change24h: '−1.92%',
    isPositive: false,
    category: 'ton',
    tag: 'Рынок РФ',
    icon: '💎',
    sub: 'Прямой курс обмена TON на рубли',
    history: {
      '1D': [96.7, 96.2, 95.8, 95.2, 94.8],
      '1W': [97.5, 97.0, 96.0, 95.0, 94.8],
      '1M': [112.0, 108.0, 104.0, 98.0, 94.8],
      '1Y': [180.0, 210.0, 190.0, 140.0, 94.8],
    },
  },
  {
    id: 'NOT/USD',
    name: 'Notcoin',
    symbol: 'NOT',
    pair: 'NOT / USD',
    price: 0.000348,
    priceFormatted: '$0.000348',
    change24h: '−1.50%',
    isPositive: false,
    category: 'ton',
    tag: 'TON Gaming',
    icon: '⚡',
    sub: 'Главный игровой токен Telegram',
    history: {
      '1D': [0.000355, 0.000352, 0.000349, 0.000348],
      '1W': [0.000368, 0.00036, 0.000352, 0.000348],
      '1M': [0.00048, 0.00042, 0.00038, 0.000348],
      '1Y': [0.0012, 0.002, 0.001, 0.000348],
    },
  },
  {
    id: 'DOGS/USD',
    name: 'DOGS Community',
    symbol: 'DOGS',
    pair: 'DOGS / USD',
    price: 0.0000315,
    priceFormatted: '$0.0000315',
    change24h: '+0.80%',
    isPositive: true,
    category: 'ton',
    tag: 'TON Social',
    icon: '🐶',
    sub: 'Мем-токен сообщества Telegram',
    history: {
      '1D': [0.0000312, 0.0000313, 0.0000314, 0.0000315],
      '1W': [0.0000345, 0.000033, 0.000032, 0.0000315],
      '1M': [0.000055, 0.000045, 0.000036, 0.0000315],
      '1Y': [0.0001, 0.00008, 0.0000315],
    },
  },
  {
    id: 'TON/USDT',
    name: 'TON Swap (DEX)',
    symbol: 'TON',
    pair: 'TON / USDT',
    price: 1.17,
    priceFormatted: '1.170 USDT',
    change24h: '−2.41%',
    isPositive: false,
    category: 'ton',
    tag: 'DEX STON.fi',
    icon: '🔄',
    sub: 'Пул ликвидности DeDust & STON.fi',
    history: {
      '1D': [1.198, 1.19, 1.182, 1.175, 1.17],
      '1W': [1.22, 1.20, 1.185, 1.17],
      '1M': [1.45, 1.38, 1.28, 1.21, 1.17],
      '1Y': [2.2, 2.7, 2.1, 1.6, 1.17],
    },
  },
  {
    id: 'USDT/EUR',
    name: 'Евро (Visa EU)',
    symbol: 'EUR',
    pair: 'USDT / EUR',
    price: 0.892,
    priceFormatted: '0.892 €',
    change24h: '+0.11%',
    isPositive: true,
    category: 'fiat',
    tag: 'Visa Platinum',
    icon: '🇪🇺',
    sub: 'Курс покупок по европейской карте',
    history: {
      '1D': [0.891, 0.8915, 0.892],
      '1W': [0.888, 0.89, 0.891, 0.892],
      '1M': [0.882, 0.886, 0.89, 0.892],
      '1Y': [0.85, 0.88, 0.91, 0.892],
    },
  },
  {
    id: 'EUR/RUB',
    name: 'Евро к рублю',
    symbol: 'EUR',
    pair: 'EUR / RUB',
    price: 90.87,
    priceFormatted: '90.87 ₽',
    change24h: '+0.15%',
    isPositive: true,
    category: 'fiat',
    tag: 'Валютный рынок',
    icon: '💶',
    sub: 'Кросс-курс евро к российскому рублю',
    history: {
      '1D': [90.7, 90.75, 90.82, 90.87],
      '1W': [90.1, 90.3, 90.5, 90.87],
      '1M': [88.5, 89.2, 90.0, 90.87],
      '1Y': [82.0, 88.0, 96.0, 90.87],
    },
  },
  {
    id: 'USDT/AED',
    name: 'Дирхам ОАЭ (Дубай)',
    symbol: 'AED',
    pair: 'USDT / AED',
    price: 3.673,
    priceFormatted: '3.673 د.إ',
    change24h: '0.00%',
    isPositive: true,
    category: 'fiat',
    tag: 'ОАЭ / Дубай',
    icon: '🇦🇪',
    sub: 'Фиксированный курс привязки к доллару',
    history: {
      '1D': [3.673, 3.673, 3.673, 3.673],
      '1W': [3.673, 3.673, 3.673, 3.673],
      '1M': [3.673, 3.673, 3.673, 3.673],
      '1Y': [3.673, 3.673, 3.673, 3.673],
    },
  },
  {
    id: 'USDT/KZT',
    name: 'Казахстанский тенге',
    symbol: 'KZT',
    pair: 'USDT / KZT',
    price: 512.5,
    priceFormatted: '512.50 ₸',
    change24h: '+0.28%',
    isPositive: true,
    category: 'fiat',
    tag: 'Казахстан',
    icon: '🇰🇿',
    sub: 'Курс переводов и карт банков Казахстана',
    history: {
      '1D': [511.0, 511.8, 512.2, 512.5],
      '1W': [507.0, 509.0, 511.0, 512.5],
      '1M': [498.0, 503.0, 508.0, 512.5],
      '1Y': [460.0, 485.0, 515.0, 512.5],
    },
  },
  {
    id: 'USDT/TRY',
    name: 'Турецкая лира',
    symbol: 'TRY',
    pair: 'USDT / TRY',
    price: 36.85,
    priceFormatted: '36.85 ₺',
    change24h: '−0.35%',
    isPositive: false,
    category: 'fiat',
    tag: 'Турция',
    icon: '🇹🇷',
    sub: 'Оплата отелей и подписок в Турции',
    history: {
      '1D': [36.98, 36.92, 36.88, 36.85],
      '1W': [36.7, 36.75, 36.8, 36.85],
      '1M': [35.9, 36.2, 36.5, 36.85],
      '1Y': [29.5, 32.0, 35.0, 36.85],
    },
  },
  {
    id: 'USDT/CNY',
    name: 'Китайский юань',
    symbol: 'CNY',
    pair: 'USDT / CNY',
    price: 7.28,
    priceFormatted: '7.28 ¥',
    change24h: '+0.05%',
    isPositive: true,
    category: 'fiat',
    tag: 'Китай',
    icon: '🇨🇳',
    sub: 'Курс расчетов с поставщиками и фабриками',
    history: {
      '1D': [7.276, 7.278, 7.28],
      '1W': [7.26, 7.27, 7.275, 7.28],
      '1M': [7.23, 7.25, 7.27, 7.28],
      '1Y': [7.12, 7.2, 7.29, 7.28],
    },
  },
];

export const RatesView: React.FC<RatesViewProps> = ({ ratesData, isLoading = false, onRefresh }) => {
  const items: CurrencyItem[] = ratesData?.items && ratesData.items.length > 0 ? ratesData.items : fallbackItems;

  const [selectedId, setSelectedId] = useState<string>('USDT/RUB');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Интерактивный hover/scrubbing на графике
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Реальные свечные данные из API
  const [realChartData, setRealChartData] = useState<RealChartResult | null>(null);

  // Выбранный инструмент
  const activeItem = useMemo(() => {
    return items.find((x) => x.id === selectedId) || items[0];
  }, [items, selectedId]);

  // Загрузка реальных рыночных свечей при смене пары или таймфрейма
  useEffect(() => {
    let isCancelled = false;
    ApiClient.getRealChart(selectedId, timeframe).then((chart) => {
      if (!isCancelled && chart && chart.points.length > 0) {
        setRealChartData(chart);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedId, timeframe]);

  // Данные для графика: реальные рыночные свечи из API, либо точки из каталога
  const chartPoints = useMemo(() => {
    if (realChartData && realChartData.symbol === selectedId && realChartData.timeframe === timeframe) {
      return realChartData.points.map((p) => p.price);
    }
    const raw = activeItem.history?.[timeframe] || [activeItem.price * 0.98, activeItem.price];
    return raw;
  }, [realChartData, selectedId, timeframe, activeItem]);

  const chartPointTimes = useMemo(() => {
    if (realChartData && realChartData.symbol === selectedId && realChartData.timeframe === timeframe) {
      return realChartData.points.map((p) => p.time);
    }
    return null;
  }, [realChartData, selectedId, timeframe]);

  // Мин / Макс для шкалы графика
  const { minVal, maxVal, displayMin, displayMax } = useMemo(() => {
    let min = Math.min(...chartPoints);
    let max = Math.max(...chartPoints);
    if (min === max) {
      min *= 0.99;
      max *= 1.01;
    }
    const padding = (max - min) * 0.12;
    return {
      minVal: min - padding,
      maxVal: max + padding,
      displayMin: min,
      displayMax: max,
    };
  }, [chartPoints]);

  // Координаты SVG точек
  const svgWidth = 360;
  const svgHeight = 140;
  const paddingX = 14;
  const paddingY = 12;

  const pointsCoords = useMemo(() => {
    const n = chartPoints.length;
    const availableW = svgWidth - paddingX * 2;
    const availableH = svgHeight - paddingY * 2;

    return chartPoints.map((val, idx) => {
      const x = paddingX + (idx / Math.max(1, n - 1)) * availableW;
      const normalizedY = (val - minVal) / Math.max(0.0001, maxVal - minVal);
      const y = svgHeight - paddingY - normalizedY * availableH;
      return { x, y, val };
    });
  }, [chartPoints, minVal, maxVal]);

  // Построение плавной SVG кривой Безье
  const { pathD, fillD } = useMemo(() => {
    if (pointsCoords.length < 2) return { pathD: '', fillD: '' };

    let d = `M ${pointsCoords[0].x.toFixed(1)},${pointsCoords[0].y.toFixed(1)}`;
    for (let i = 0; i < pointsCoords.length - 1; i++) {
      const p0 = pointsCoords[i];
      const p1 = pointsCoords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx.toFixed(1)},${p0.y.toFixed(1)} ${cx.toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    }

    const last = pointsCoords[pointsCoords.length - 1];
    const first = pointsCoords[0];
    const fill = `${d} L ${last.x.toFixed(1)},${svgHeight} L ${first.x.toFixed(1)},${svgHeight} Z`;

    return { pathD: d, fillD: fill };
  }, [pointsCoords]);

  // Текущая отображаемая цена (динамически меняется при скраббинге пальцем)
  const activeHoverPrice = useMemo(() => {
    if (hoveredIndex !== null && pointsCoords[hoveredIndex]) {
      const val = pointsCoords[hoveredIndex].val;
      if (val >= 1000) {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (val < 0.01) {
        return `$${val.toFixed(6)}`;
      }
      return `${val.toFixed(2)}`;
    }
    return activeItem.priceFormatted;
  }, [hoveredIndex, pointsCoords, activeItem]);

  // Обработка скраббинга мыши / тача
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    pointsCoords.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredTimeStr = useMemo(() => {
    if (hoveredIndex !== null) {
      if (chartPointTimes && chartPointTimes[hoveredIndex]) {
        const d = new Date(chartPointTimes[hoveredIndex]);
        if (timeframe === '1D') {
          return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      }

      // Если точки локальные (fallback), интерполируем время назад от текущего момента
      const now = Date.now();
      const n = chartPoints.length;
      const durationMs =
        timeframe === '1D'
          ? 24 * 3600 * 1000
          : timeframe === '1W'
          ? 7 * 24 * 3600 * 1000
          : timeframe === '1M'
          ? 30 * 24 * 3600 * 1000
          : 365 * 24 * 3600 * 1000;
      const fraction = hoveredIndex / Math.max(1, n - 1);
      const estTime = now - (1 - fraction) * durationMs;
      const d = new Date(estTime);
      if (timeframe === '1D') {
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return null;
  }, [hoveredIndex, chartPointTimes, chartPoints.length, timeframe]);

  // Динамические метки оси X на основе реальной текущей даты (график заканчивается СЕГОДНЯ)
  const dynamicAxisLabels = useMemo(() => {
    const now = new Date();
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    if (timeframe === '1D') {
      const h24 = new Date(now.getTime() - 24 * 3600 * 1000);
      const h18 = new Date(now.getTime() - 18 * 3600 * 1000);
      const h12 = new Date(now.getTime() - 12 * 3600 * 1000);
      const h6 = new Date(now.getTime() - 6 * 3600 * 1000);
      const fmtH = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      return [
        { label: fmtH(h24) },
        { label: fmtH(h18) },
        { label: fmtH(h12) },
        { label: fmtH(h6) },
        { label: 'Сейчас', isCurrent: true },
      ];
    }

    if (timeframe === '1W') {
      // 7 дней назад до СЕГОДНЯ (сегодняшний день недели всегда справа)
      const d6 = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
      const d4 = new Date(now.getTime() - 4.5 * 24 * 3600 * 1000);
      const d3 = new Date(now.getTime() - 3 * 24 * 3600 * 1000);
      const d1 = new Date(now.getTime() - 1.5 * 24 * 3600 * 1000);
      const todayDay = dayNames[now.getDay()];

      return [
        { label: dayNames[d6.getDay()] },
        { label: dayNames[d4.getDay()] },
        { label: dayNames[d3.getDay()] },
        { label: dayNames[d1.getDay()] },
        { label: `${todayDay} (сегодня)`, isCurrent: true },
      ];
    }

    if (timeframe === '1M') {
      const fmtD = (daysAgo: number) => {
        const d = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
      };
      return [
        { label: fmtD(30) },
        { label: fmtD(22) },
        { label: fmtD(15) },
        { label: fmtD(7) },
        { label: 'Сегодня', isCurrent: true },
      ];
    }

    // 1Y
    const curM = now.getMonth();
    return [
      { label: `${monthNames[curM]} ${now.getFullYear() - 1}` },
      { label: monthNames[(curM - 9 + 12) % 12] },
      { label: monthNames[(curM - 6 + 12) % 12] },
      { label: monthNames[(curM - 3 + 12) % 12] },
      { label: 'Сейчас', isCurrent: true },
    ];
  }, [timeframe]);

  const activeChangeStr = useMemo(() => {
    if (realChartData && realChartData.symbol === selectedId && realChartData.timeframe === timeframe) {
      return realChartData.changePercent;
    }
    return activeItem.change24h;
  }, [realChartData, selectedId, timeframe, activeItem]);

  // Фильтрация расширенного каталога
  const filteredItems = useMemo(() => {
    let result = items;
    if (categoryFilter !== 'all') {
      result = result.filter((x) => x.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.symbol.toLowerCase().includes(q) ||
          x.pair.toLowerCase().includes(q) ||
          x.tag.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, categoryFilter, searchQuery]);

  // Цветовая тема активной пары
  const isPositiveTrend = useMemo(() => {
    return !activeChangeStr.startsWith('-') && !activeChangeStr.startsWith('−');
  }, [activeChangeStr]);

  const themeStroke = isPositiveTrend ? '#06b6d4' : '#f43f5e';
  const themeFillId = isPositiveTrend ? 'cyanGrad' : 'roseGrad';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-28 pt-2"
    >
      {/* 1. Header (Без неуклюжего текста «В реальном времени») */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Курсы валют</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TON • Live
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Биржевые котировки блокчейна TON, крипты и СБП
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
            title="Обновить котировки"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}
      </div>

      {/* 2. Доработанный интерактивный график */}
      <div className="px-4">
        <div className="glass-panel rounded-3xl p-4.5 bg-slate-900/95 border border-slate-800 shadow-xl relative overflow-hidden">
          {/* Верхняя плашка графика с ценой и статами */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base flex-shrink-0">{activeItem.icon}</span>
                <span className="text-xs font-bold text-slate-200 truncate">{activeItem.name}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 whitespace-nowrap flex-shrink-0">
                  {activeItem.pair.replace(' / ', '/')}
                </span>
              </div>

              {/* Большая динамическая цена */}
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-black font-mono text-white tracking-tight transition-all">
                  {activeHoverPrice}
                </div>
                {hoveredTimeStr ? (
                  <div className="flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 whitespace-nowrap">
                    {hoveredTimeStr}
                  </div>
                ) : (
                  <div
                    className={`flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                      isPositiveTrend
                        ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                        : 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                    }`}
                  >
                    {isPositiveTrend ? (
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    <span>{activeChangeStr}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Селектор таймфреймов с плавной анимацией скольжения */}
            <div className="flex gap-0.5 bg-slate-800/90 p-1 rounded-xl text-[10px] font-bold border border-slate-700/60 shadow-inner flex-shrink-0">
              {(['1D', '1W', '1M', '1Y'] as const).map((t) => {
                const isActive = timeframe === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeframe(t);
                      setHoveredIndex(null);
                    }}
                    className={`relative px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                      isActive ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTimeframePill"
                        className="absolute inset-0 bg-cyan-400 rounded-lg shadow-sm shadow-cyan-400/30"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Статистика Макс / Мин */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-800/60 mb-2">
            <div>
              <span className="text-slate-500">Макс: </span>
              <span className="text-slate-300 font-semibold">
                {displayMax >= 100 ? displayMax.toFixed(2) : displayMax.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Мин: </span>
              <span className="text-slate-300 font-semibold">
                {displayMin >= 100 ? displayMin.toFixed(2) : displayMin.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Canvas SVG графика */}
          <div className="relative h-36 w-full select-none touch-none">
            <svg
              ref={chartSvgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onPointerDown={handlePointerMove}
            >
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 3 Горизонтальные сетки */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <line
                x1={paddingX}
                y1={svgHeight / 2}
                x2={svgWidth - paddingX}
                y2={svgHeight / 2}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />

              {/* Заливка области под кривой с плавной анимацией */}
              <AnimatePresence mode="wait">
                {fillD && (
                  <motion.path
                    key={`fill-${selectedId}-${timeframe}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    d={fillD}
                    fill={`url(#${themeFillId})`}
                  />
                )}
              </AnimatePresence>

              {/* Основная плавная линия графика с анимацией рисования */}
              <AnimatePresence mode="wait">
                {pathD && (
                  <motion.path
                    key={`path-${selectedId}-${timeframe}`}
                    initial={{ pathLength: 0, opacity: 0.3 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    d={pathD}
                    fill="none"
                    stroke={themeStroke}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </AnimatePresence>

              {/* Маркер последней точки (пульсирует) */}
              {pointsCoords.length > 0 && hoveredIndex === null && (
                <g>
                  <circle
                    cx={pointsCoords[pointsCoords.length - 1].x}
                    cy={pointsCoords[pointsCoords.length - 1].y}
                    r="4"
                    fill={themeStroke}
                  />
                  <circle
                    cx={pointsCoords[pointsCoords.length - 1].x}
                    cy={pointsCoords[pointsCoords.length - 1].y}
                    r="8"
                    fill={themeStroke}
                    opacity="0.35"
                    className="animate-ping"
                  />
                </g>
              )}

              {/* Интерактивный курсор скраббинга при наведении / таче */}
              {hoveredIndex !== null && pointsCoords[hoveredIndex] && (
                <g>
                  {/* Вертикальная направляющая */}
                  <line
                    x1={pointsCoords[hoveredIndex].x}
                    y1={paddingY}
                    x2={pointsCoords[hoveredIndex].x}
                    y2={svgHeight - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.75"
                  />
                  {/* Точка на графике */}
                  <circle
                    cx={pointsCoords[hoveredIndex].x}
                    cy={pointsCoords[hoveredIndex].y}
                    r="5"
                    fill="#ffffff"
                    stroke={themeStroke}
                    strokeWidth="3"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Временная шкала внизу графика с реальными датами */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 px-1">
            {dynamicAxisLabels.map((item, idx) => (
              <span
                key={idx}
                className={item.isCurrent ? 'text-cyan-400 font-bold' : undefined}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Расширенный каталог валют */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Каталог популярных валют</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {pluralize(filteredItems.length, 'пара', 'пары', 'пар')}
          </span>
        </div>

        {/* Поисковая строка */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск: BTC, TON, СБП, EUR, USDT..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Табы фильтров категорий */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
          {[
            { id: 'all', label: '🔥 Все котировки' },
            { id: 'ton', label: '💎 TON экосистема' },
            { id: 'crypto', label: '🪙 Топ Крипта' },
            { id: 'fiat', label: '💱 Фиат и СБП' },
          ].map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap active:scale-95 transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Список карточек валют */}
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const isSelected = item.id === activeItem.id;
            const isPositive = item.isPositive;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setHoveredIndex(null);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-500/60 shadow-lg shadow-cyan-950/20 ring-1 ring-cyan-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 active:scale-98'
                }`}
              >
                {/* Левая часть: Иконка, название и валютная пара */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white truncate block">{item.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">{item.pair}</span>
                  </div>
                </div>

                {/* Правая часть: Цена и суточный % */}
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-sm font-black font-mono text-white">{item.priceFormatted}</div>
                  <div
                    className={`inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                      isPositive
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {item.change24h}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Ничего не найдено по запросу «{searchQuery}»
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
