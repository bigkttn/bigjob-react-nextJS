import styles from './footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footerContainer}>
     <hr/>
      <div className={styles.footerContent}>
        
        {/* Column 1: User Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>Total Users</span>
            <span className={styles.value}>100,000</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>General Users</span>
            <span className={styles.value}>90,000</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>Companies</span>
            <span className={styles.value}>1,000</span>
          </div>
        </div>

        {/* Column 2: Job Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>All Jobs</span>
            <span className={styles.value}>500,000</span>
          </div>
        </div>

        {/* Column 3: Visitor Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>Visitors</span>
            <span className={styles.value}>300,000</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;