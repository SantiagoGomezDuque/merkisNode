const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db');

const FACEBOOK_APP_ID = '1749048885695055';
const FACEBOOK_APP_SECRET = '518e8347c9e99fc7127e7d7932e1d59a';
const FACEBOOK_CALLBACK_URL = 'http://localhost:3000/auth/facebook/callback';

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'emails']
  },
  function(accessToken, refreshToken, profile, done) {
    // Extraer datos de Facebook
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const full_name = profile.displayName || '';
    const username = profile.username || profile.id;
    const password = profile.id; // Puedes usar el id de Facebook como password dummy
    const telefono = '';
    const departamento = '';
    const direccion = '';
    const municipio = '';

    if (!email) {
      return done(null, false, { message: 'No se pudo obtener el correo de Facebook.' });
    }

    // Buscar usuario por email
    let user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

    if (!user) {
      // Crear usuario si no existe
      db.prepare(`
        INSERT INTO usuarios (full_name, email, username, telefono, departamento, direccion, municipio, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(full_name, email, username, telefono, departamento, direccion, municipio, password);

      user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    }

    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  done(null, user);
});