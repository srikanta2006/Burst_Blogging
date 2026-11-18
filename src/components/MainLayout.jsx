// src/components/MainLayout.jsx

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import styles from './MainLayout.module.css';

function MainLayout() {
  return (
    <div className={styles.layoutWrapper}>
      <Navbar />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
