import Head from 'next/head';
import LoginForm from '../components/LoginForm';
import styles from '../styles/login.module.css';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Login</title>
      </Head>
      <h1 className={styles.title}>Welcome to Poko</h1>
      <LoginForm />
    </div>
  );
}
