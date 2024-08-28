let currentsong = new Audio(); // Create a single Audio object
let songList = []; // Global array to store the song list
console.log("lll")

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function fetchMP3Files(folders, callback) {
    let allMP3Files = [];

    Promise.all(folders.map(folder => 
        fetch(folder)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text(); // Parse the response as text
            })
            .then(text => {
                let div = document.createElement("div");
                div.innerHTML = text;

                let liElements = div.getElementsByTagName("li");
                let mp3Files = Array.from(liElements).map(li => {
                    let link = li.querySelector('a[href$=".mp3"]');
                    return link ? {
                        file: link.getAttribute('title'), 
                        path: folder // Include the correct folder path
                    } : null;
                }).filter(Boolean);

                allMP3Files.push(...mp3Files);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            })
    )).then(() => {
        callback(allMP3Files); // Pass the aggregated mp3Files array to the callback
    });
}

const playMusic = (track) => {
    if (currentsong) {
        currentsong.pause();
        currentsong.currentTime = 0;
    }

    currentsong.src = `${track.path}/${track.file}`;
    currentsong.play().catch(error => {
        console.error('Error playing audio:', error);
    });

    play.src = "pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURI(track.file);
    document.querySelector(".songtime").innerHTML = "00:00";
};

function loadSongsFromFolder(folder, callback) {
    fetchMP3Files([folder], function(mp3Files) {
        if (mp3Files.length > 0) {
            songList = mp3Files; // Store the song list globally

            let songListElement = document.querySelector(".songlist ul");
            songListElement.innerHTML = ''; // Clear existing list

            mp3Files.forEach((track, index) => {
                let listItem = document.createElement('li');
                listItem.innerHTML = `
                    <img class="invert" src="music.svg" alt="">
                    <div class="info">
                        <div>${track.file}</div>
                        <div>${track.path.split('/').pop()}</div> <!-- Display folder name -->
                    </div>
                    <img class="invert" src="play.svg" alt="">
                `;

                songListElement.appendChild(listItem);

                listItem.querySelector('img[src="play.svg"]').addEventListener("click", () => {
                    console.log('Playing:', track.file);
                    playMusic(track);
                });
            });

            if (callback && typeof callback === "function") {
                callback(mp3Files[0]); // Play the first song
            }
        } else {
            console.error('No MP3 files found');
        }
    });
}

async function displayAlbums() {
    console.log("displayAlbums function started");
    try {
        let response = await fetch(`http://127.0.0.1:5501`);
        console.log("Root directory fetched successfully");

        let text = await response.text();
        console.log("Root directory content received");

        let div = document.createElement("div");
        div.innerHTML = text;

        let liElements = div.getElementsByTagName("li");
        console.log("liElements extracted:", liElements);

        let cardContainer = document.querySelector(".cardContainer");
        console.log("Card container selected");

        Array.from(liElements).forEach(async li => {
            let anchor = li.querySelector('a');
            if (anchor && anchor.getAttribute('href').startsWith("/")) {
                let folderName = anchor.getAttribute('title');
                console.log("Processing folder:", folderName);

                try {
                    let jsonResponse = await fetch(`http://127.0.0.1:5501${anchor.getAttribute('href')}/info.json`);
                    console.log(`info.json fetched for ${folderName}`);

                    let folderInfo = await jsonResponse.json();
                    console.log("Folder Info:", folderInfo);

                    cardContainer.innerHTML += `
                    <div class="card" data-folder="${folderName}">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="black">
                                <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="http://127.0.0.1:5501/${folderName}/cover.png" alt="">
                        <h2>${folderInfo.title}</h2>
                        <p>${folderInfo.description}</p>
                    </div>
                    `;
                    Array.from(document.getElementsByClassName("card")).forEach((e) => {
                        e.addEventListener("click", item => {
                            let folder = `http://127.0.0.1:5501/${item.currentTarget.dataset.folder}/`;
                            console.log('Folder path from card click:', folder); // Debugging line
                            
                            // Load songs from the clicked folder and play the first one
                            loadSongsFromFolder(folder, firstSong => {
                                playMusic(firstSong);
                            });
                        });
                    });
                    
                    
                    
                } catch (error) {
                    console.error(`Failed to fetch info.json for folder ${folderName}:`, error);
                }
            } else {
                console.log(`Anchor or folder not found or does not include 5501 in href:`, anchor);
            }
        });
    } catch (error) {
        console.error('Failed to fetch the root directory:', error);
    }
}

 // Ensure the function is being called




function main() {
    // Load songs from the default folder on initial load
    loadSongsFromFolder('http://127.0.0.1:5501/ncs/');
    displayAlbums()

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "pause.svg";
        } else {
            currentsong.pause();
            play.src = "play.svg";
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        if (!isNaN(currentsong.duration) && currentsong.duration > 0) {
            const progressPercentage = (currentsong.currentTime / currentsong.duration) * 100;
            document.querySelector(".circle").style.left = progressPercentage + "%";
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)}/${secondsToMinutesSeconds(currentsong.duration)}`;
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-110%";
    });

    prev.addEventListener("click", () => {
        let currentTrack = currentsong.src.split("/").pop(); // Get the current track name
        let index = songList.findIndex(track => track.file === currentTrack); // Find index by track name
        console.log("Previous button clicked, current track index:", index);

        if (index > 0) {
            let previousTrack = songList[index - 1];
            console.log("Playing previous track:", previousTrack.file);
            playMusic(previousTrack);
        } else {
            console.log("Already at the first track or track not found.");
        }
    });

    next.addEventListener("click", () => {
        let currentTrack = currentsong.src.split("/").pop(); // Get the current track name
        let index = songList.findIndex(track => track.file === currentTrack); // Find index by track name
        console.log("Next button clicked, current track index:", index);

        if (index < songList.length - 1) {
            let nextTrack = songList[index + 1];
            playMusic(nextTrack);
        } else {
            console.log("Already at the last track.");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", (e) => {
        let img = e.target;
        let volumeIcon = "volume.svg";
        let muteIcon = "mute.svg";
    
        if (img.src.endsWith(volumeIcon)) {
            img.src = img.src.replace(volumeIcon, muteIcon);
            console.log("Icon changed to:", img.src); // Debugging line
            currentsong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else if (img.src.endsWith(muteIcon)) {
            img.src = img.src.replace(muteIcon, volumeIcon);
            console.log("Icon changed to:", img.src); // Debugging line
            currentsong.volume = 0.1; // Set to a default value if needed
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10; // Update the slider accordingly
        }
    });
    

    
}

main();
