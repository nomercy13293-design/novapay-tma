import React from 'react';
import { motion } from 'framer-motion';
import { BalanceCard } from '../components/BalanceCard';
import { TransactionHistory } from '../components/TransactionHistory';
import type { Transaction } from '../types';

interface HomeViewProps {
  balanceUsdt: number;
  rate: number;
  transactions: Transaction[];
  onOpenDeposit: () => void;
  onOpenTransfer: () => void;
  onOpenSbpScanner: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  balanceUsdt,
  rate,
  transactions,
  onOpenDeposit,
  onOpenTransfer,
  onOpenSbpScanner,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.25 }}
      className="space-y-2 pb-24"
    >
      {/* Balance Card + 3 Main Action Buttons */}
      <BalanceCard
        balanceUsdt={balanceUsdt}
        rate={rate}
        onOpenDeposit={onOpenDeposit}
        onOpenTransfer={onOpenTransfer}
        onOpenSbpScanner={onOpenSbpScanner}
      />

      {/* Transaction History with Filter Tabs */}
      <div className="pt-2">
        <TransactionHistory transactions={transactions} />
      </div>
    </motion.div>
  );
};
