# Hosting Kevin's Games With GitHub Pages

Use GitHub Pages for the first public phone link.

## Upload The App

1. Create a GitHub account or sign in.
2. Create a new repository named `kevins-games`.
3. Upload everything inside this `dominoes-friends` folder to the repository.
4. Commit the files.

## Turn On GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`.
6. Save.

GitHub will publish the game at a link like:

```text
https://YOUR-GITHUB-NAME.github.io/kevins-games/
```

## Phone Install

1. Open the GitHub Pages link on a phone.
2. Sign in or sign up.
3. Use **Add to Home Screen** on iPhone or **Install app** on Android.

## Online Rooms

The app can be hosted before online rooms are configured. To turn online rooms on, add a Firebase Realtime Database URL in `online-config.js`.

```js
window.TABLE_NIGHT_ONLINE = {
  databaseURL: "https://YOUR-PROJECT.firebaseio.com"
};
```

Use `firebase-realtime-database-rules.json` as starter database rules while testing.

## QR Codes

After hosting, open the app from the GitHub Pages link and use **Show app QR**. The QR will point phones to the public GitHub Pages link.
