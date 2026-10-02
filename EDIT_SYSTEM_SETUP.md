# KTG Edit System — fixed connection

## What was fixed
- Restaurant Edit button now sends `placeId` and `restaurantId`, matching `edit.html`.
- GitHub Pages frontend sends verification/load/save requests to the Render backend.
- Render API now allows cross-origin requests from the GitHub Pages site.
- Save writes the updated split database to both `data/places-N.json` and root `places-N.json` when both copies exist.
- Business-specific verification IDs and the master admin ID are still checked by the server before every save.

## Backend URL
The frontend is configured for:
`https://kolkata-tourist-guide.onrender.com`

If your Render URL is different, edit `api-config.js` and change `DEFAULT_API_ORIGIN`.

## Important
Run/deploy the Node project (`npm start`) on Render. GitHub Pages alone cannot run `server.js` or persist JSON changes.
