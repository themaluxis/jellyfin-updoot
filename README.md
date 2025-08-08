# jellyfin-updoot
this is an injection mod for jellyfin that adds a thumbs up, comments section and reccomended by users page

this is created to give users an interaction and ideas of things to watch, want to warn someone about some movie being terrible and not worth their time, leave a comment

if you want to tell a user the movie is awesome etc you can simply leave a comment 

thumbs up to add it to the reccomendations page

admin users (they dont have to be admins in jellyfin but have to have their jellyfin userid defined in the python backend) can see a settings cog and administrage the comments section to make sure they dont have anything stupid or bad on there.

## Screenshots:
![Screenshot 2025-07-04 195513](https://github.com/user-attachments/assets/46b6f059-ae7b-46d7-97c6-528524cfa312)
![Screenshot 2025-07-04 195820](https://github.com/user-attachments/assets/8a28091c-56a7-4b09-8902-f18feb3268ce)
![Screenshot 2025-07-04 195706](https://github.com/user-attachments/assets/f9fa9dd3-5d26-46c6-9e1a-0391237be6cb)
![Screenshot 2025-07-04 195653](https://github.com/user-attachments/assets/74073f5c-642c-4486-a489-b2204f68247f)
![Screenshot 2025-07-04 195551](https://github.com/user-attachments/assets/21dbbd4c-c49e-4131-b9ab-03c16137bb5a)
![Screenshot 2025-07-04 195529](https://github.com/user-attachments/assets/0815cec9-ad8b-444f-8e0e-1bf6b7e08c15)



## how it works:

it injects a script that adds the functions to call to a flask backend that runs on the same server in the background. it has its own database and doesnt interfere with the main database, it has its own backend sending all the thumbs and comments etc via /updoot/ so gets a redirect from a reverse proxy.

## requirements:
the ability to run python as a command in your setup (no i dont own every system to test on them but it has been tested on ubuntu headless and runs as expected)

nginx (other reverse proxies may work but again im not using these so wont be 100% on those)

a manual method injection script from either manually putting one in or having one of my other mods installed (pause screen, media bar etc) if you dont have it you wont get it to work because it wont log you into the backend you can add this to manually inject the credentials if you dont have one just add before the </body> tag

```
<script>const saveJellyfinCredentials = (serverId, accessToken) => {
    const credentials = {
        Servers: [{ Id: serverId, AccessToken: accessToken }],
    };

    try {
        localStorage.setItem("jellyfin_credentials", JSON.stringify(credentials));
        console.log("Jellyfin credentials saved successfully.");
    } catch (e) {
        console.error("Error saving Jellyfin credentials", e);
    }
};</script>
```
if you already use one of my mods or have the plugin version of the media bar installed they already have this method

## installation:

1.  **Download the files:**
    Download `backendupdoot.py`, `updoot.js`, `updoot.css`, and `config.py` from this repository.

2.  **Configure the backend:**
    -   Open `config.py` in a text editor.
    -   Set `JELLYFIN_URL` to your Jellyfin domain name.
    -   Set `JELLYFIN_API_KEY` to your Jellyfin API key.
    -   Add the user IDs of your admin users to the `ADMIN_USER_IDS` list.

3.  **Install Python dependencies:**
    ```
    pip install flask requests
    ```

4.  **Run the backend service:**
    ```
    nohup python3 backendupdoot.py > backendupdoot.log 2>&1 &
    ```

5.  **Place the frontend files:**
    -   Copy `updoot.js` and `updoot.css` to your Jellyfin web root directory (e.g., `/usr/share/jellyfin/web/`).

6.  **Inject the script:**
    -   Open `index.html` in your Jellyfin web root.
    -   Add the following line before the closing `</body>` tag:
        ```html
        <script defer src="updoot.js"></script>
        ```

in nginx you simply add the following to your jellyfin config 

```
    # Proxy to Flask backend for recommendation API
    location /updoot/ {
        proxy_pass http://YOURSERVERIP:8099/updoot/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
    }
```

clear your browser cache or client cache and reload the page (you can do this in most browsers by right clicking anywhere on the page and clicking inspect > network tab> disable cache then pressing f5)

## faq:

can this run on truenas? no clue i dont have it but if you can run terminal and python then you should be able to do this but im not 100% sure on each specific setup so again give it a try but if you are unsure google for a guide for running python on your system and basic file editing inside of docker terminals would be the place to start before opening an issue.

does this work on mobile? yes it works just fine on mobile and xbox and pc etc this is a jellyfin-web injection mod.

will this survive a jellyfin update? yes and no, yes for the most part you just need to add the injection script to the index.html again and you will be back where you left off.

do i mind pull requests? i dont mind but please try to make it clear what the pull request is for before hiting submit (most of the time im doing things like this in my free time for my own server but i like to share with the community so usually check github every few days or when im about to go to sleep so wont really be instantly responding)

would i make this into a plugin? yes if someone can show me the docs required to build via a headless linux environment. i cant build with windows (i know that is weird but trust me my setup wont play nice with it)

can anyone turn this into a plugin? sure its open source and if you can then do so, just please link back to the original somewhere in the description and im fine with it.

can we donate? sure thing thank you https://ko-fi.com/bobhasnosoul 
