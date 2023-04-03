import { useState } from 'react';
import styles from '../styles/login.module.css';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const { token } = await response.json();
      onLogin(token);
    } else {
      const { error } = await response.json();
      setError(error);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardLogo}>
        <img src="/logo.svg" alt="Logo" width="75" height="75" />
      </div>
      <h1 className={styles.title}>Log in</h1>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </label>
        <button type="submit" className={styles.button}>Login</button>
      </form>
      <p>
        Dont have an account?{' '}
        <a href="/register" className={styles.signUpLink}>
          Sign up
        </a>
      </p>
    </div>
  );
}

export default LoginForm;            

  