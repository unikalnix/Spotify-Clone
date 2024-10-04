let currentAudio = null; // Variable to hold the currently playing audio
let currentSongIndex = 0; // Index of the current song
let currentLi = null; // Store the currently playing li element
let isSeeking = false; // Variable to track whether the user is seeking

const playListSongsUl = document.getElementById('play-list-songs-ul');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeRange = document.getElementById('volume-range');
const volumeIcon = document.getElementById('volume-icon');
const progressBar = document.getElementById('progress-bar');
const durationLabel = document.getElementById('duration');
const songNameLabel = document.getElementById('song-name');
const folders = document.querySelectorAll('#songs-folder');

let songs = []; // Array to hold the list of songs
let songsFetched = false; // Flag to prevent multiple fetch calls
let dataIndex = 0; // Initialize dataIndex

// Fetch and display songs from the specified directory
const fetchSongs = async (folderName) => {
    // Reset songs array and fetched flag when a new folder is clicked
    songs = []; // Clear previous songs
    songsFetched = false; // Reset the flag

    if (songsFetched) return; // Prevent multiple fetch calls
    songsFetched = true; // Set the flag to true

    try {
        const response = await fetch(`/albums/${folderName}/`);
        const text = await response.text();

        const div = document.createElement('div');
        div.innerHTML = text;
        let links = div.getElementsByTagName('a');
        links = Array.from(links);

        // Clear existing songs in the playlist
        playListSongsUl.innerHTML = ''; // Clear previous songs in the playlist
        dataIndex = 0; // Reset dataIndex for new folder

        links.forEach(link => {
            if (link.href.endsWith('.mp3')) {
                const decodedUrl = decodeURIComponent(link.href);
                const songName = decodedUrl.split(`/albums/${folderName}/`)[1]?.replace('.mp3', '');

                if (songName) {
                    songs.push({ name: songName, url: link.href });

                    // Create the song list item and append it to the playlist
                    const li = document.createElement('li');
                    dataIndex++; // Increment dataIndex
                    li.innerHTML = `
                        <div data-index="${dataIndex}" class="playlist-songs-item">
                            <div class="playlist-songs-info">
                                <i class="fa-solid fa-music"></i>
                                <h1>${songName}</h1>
                            </div>
                            <div class="playlist-songs-control">
                                <h1>Play</h1>
                                <i class="fa-solid fa-play"></i>
                            </div>
                        </div>
                        <hr>
                    `;
                    playListSongsUl.appendChild(li);
                } else {
                    console.error('Error parsing song name from URL:', link.href);
                }
            }
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
};


const playSong = (song, li) => {
    if (currentAudio) {
        currentAudio.pause(); // Pause any current audio
        if (currentLi) {
            updateLiIcon(currentLi, 'fa-pause', 'fa-play'); // Update the previous li element
            currentLi.classList.remove('active'); // Remove active class from the previous li
        }
    }

    currentAudio = new Audio(song.url);
    currentSongIndex = songs.findIndex(s => s.url === song.url); // Update the current song index
    songNameLabel.textContent = song.name; // Update song name
    currentAudio.volume = volumeRange.value / 100; // Set initial volume
    currentLi = li; // Store reference to the currently playing li element

    // Add active class to the current li
    currentLi.classList.add('active');

    currentAudio.addEventListener('loadedmetadata', () => {
        progressBar.max = currentAudio.duration; // Set max duration for progress bar
        updateDuration(); // Update duration immediately after loading metadata
    });
    currentAudio.addEventListener('timeupdate', updateProgress);
    currentAudio.play();

    updateLiIcon(currentLi, 'fa-play', 'fa-pause'); // Change li icon to pause
    playBtn.classList.replace('fa-play', 'fa-pause'); // Change seek bar play button to pause
};


// Update duration label
const updateDuration = () => {
    if (currentAudio) {
        const totalMinutes = Math.floor(currentAudio.duration / 60);
        const totalSeconds = Math.floor(currentAudio.duration % 60);
        durationLabel.textContent = `${formatTime(currentAudio.currentTime)} / ${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
    }
};

// Update progress and duration
const updateProgress = () => {
    progressBar.value = currentAudio.currentTime;
    durationLabel.textContent = formatTime(currentAudio.currentTime); // Update current time label

    // Update the total duration label as well
    if (currentAudio) {
        const totalMinutes = Math.floor(currentAudio.duration / 60);
        const totalSeconds = Math.floor(currentAudio.duration % 60);
        durationLabel.textContent = `${formatTime(currentAudio.currentTime)} / ${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
    }
};

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const updateLiIcon = (li, oldIcon, newIcon) => {
    const iconElement = li.querySelector('i:last-child');
    iconElement.classList.replace(oldIcon, newIcon);
};

const togglePlayPause = () => {
    if (currentAudio.paused) {
        currentAudio.play();
        playBtn.classList.replace('fa-play', 'fa-pause');
        updateLiIcon(currentLi, 'fa-play', 'fa-pause'); // Update li to show pause icon
    } else {
        currentAudio.pause();
        playBtn.classList.replace('fa-pause', 'fa-play');
        updateLiIcon(currentLi, 'fa-pause', 'fa-play'); // Update li to show play icon
    }
};

// Volume control
volumeRange.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    if (currentAudio) {
        currentAudio.volume = volume;
    }

    // Update volume icon based on volume level
    if (volume === 0) {
        volumeIcon.className = 'fa-solid fa-volume-off';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
        volumeIcon.className = 'fa-solid fa-volume-high';
    }
});

// Progress bar control (pause on input, play on release)
progressBar.addEventListener('mousedown', (e) => {
    if (currentAudio) {
        currentAudio.pause(); // Pause the music while seeking
        isSeeking = true; // Set seeking state to true
        playBtn.classList.replace('fa-pause', 'fa-play'); // Update play button icon to play
        updateLiIcon(currentLi, 'fa-pause', 'fa-play'); // Update li icon to play
    }
});

progressBar.addEventListener('mousemove', (e) => {
    if (isSeeking && currentAudio) {
        const rect = progressBar.getBoundingClientRect(); // Get bounding rectangle of the progress bar
        const offsetX = e.clientX - rect.left; // Get x coordinate relative to progress bar
        const width = rect.width; // Width of the progress bar
        const percent = offsetX / width; // Calculate percentage of the width
        progressBar.value = percent * progressBar.max; // Update the value of progress bar
    }
});

progressBar.addEventListener('mouseup', (e) => {
    if (currentAudio && isSeeking) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left; // Get x coordinate relative to progress bar
        const width = rect.width; // Width of the progress bar
        const percent = offsetX / width; // Calculate percentage of the width
        const newTime = percent * currentAudio.duration; // Calculate new time based on clicked position
        currentAudio.currentTime = newTime; // Set audio current time based on progress bar
        currentAudio.play(); // Resume playback after seeking
        isSeeking = false; // Set seeking state to false
        playBtn.classList.replace('fa-play', 'fa-pause'); // Update play button icon to pause
        updateLiIcon(currentLi, 'fa-play', 'fa-pause'); // Update li icon to pause
    }
});

// Additional: Handling touch events for mobile users
progressBar.addEventListener('touchstart', () => {
    if (currentAudio) {
        currentAudio.pause(); // Pause on touch start
        isSeeking = true;
        playBtn.classList.replace('fa-pause', 'fa-play'); // Update icons accordingly
        updateLiIcon(currentLi, 'fa-pause', 'fa-play');
    }
});

progressBar.addEventListener('touchmove', (e) => {
    if (isSeeking && currentAudio) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = e.touches[0].clientX - rect.left; // Get x coordinate relative to progress bar
        const width = rect.width; // Width of the progress bar
        const percent = offsetX / width; // Calculate percentage of the width
        progressBar.value = percent * progressBar.max; // Update the value of progress bar
    }
});

progressBar.addEventListener('touchend', (e) => {
    if (currentAudio && isSeeking) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = e.changedTouches[0].clientX - rect.left; // Get x coordinate relative to progress bar
        const width = rect.width; // Width of the progress bar
        const percent = offsetX / width; // Calculate percentage of the width
        const newTime = percent * currentAudio.duration; // Calculate new time based on touch release
        currentAudio.currentTime = newTime; // Set current time based on touch release
        currentAudio.play(); // Resume playback
        isSeeking = false;
        playBtn.classList.replace('fa-play', 'fa-pause'); // Update icons
        updateLiIcon(currentLi, 'fa-play', 'fa-pause');
    }
});


// Playlist click event
playListSongsUl.addEventListener('click', (e) => {
    const playlistItem = e.target.closest('.playlist-songs-item');

    if (playlistItem) {
        const songIndex = Array.from(playListSongsUl.children).indexOf(playlistItem.closest('li'));
        const selectedSong = songs[songIndex];
        const li = playlistItem.closest('li');

        // Toggle play/pause for the selected song
        if (currentAudio && currentSongIndex === songIndex && !currentAudio.paused) {
            currentAudio.pause(); // Pause the song
            updateLiIcon(li, 'fa-pause', 'fa-play'); // Update icon
            playBtn.classList.replace('fa-pause', 'fa-play'); // Update seek bar icon
        } else {
            playSong(selectedSong, li); // Play the selected song
        }
    }
});

// Previous button event
prevBtn.addEventListener('click', () => {
    if (currentSongIndex > 0) {
        currentSongIndex--; // Go to the previous song
    } else {
        currentSongIndex = songs.length - 1; // Wrap to the last song if at the beginning
    }

    const previousSong = songs[currentSongIndex];
    const previousLi = playListSongsUl.children[currentSongIndex];
    playSong(previousSong, previousLi); // Play the previous song
});

// Next button event
nextBtn.addEventListener('click', () => {
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++; // Go to the next song
    } else {
        currentSongIndex = 0; // Wrap to the first song if at the end
    }

    const nextSong = songs[currentSongIndex];
    const nextLi = playListSongsUl.children[currentSongIndex];
    playSong(nextSong, nextLi); // Play the next song
});

// Play button click event
playBtn.addEventListener('click', togglePlayPause);

// Event listenr for folders

folders.forEach(folder => {

    folder.addEventListener('click', () => {
        console.log(folder.getAttribute("data-name"));
        fetchSongs(folder.getAttribute("data-name"))
    })
})

hamburger.addEventListener('click', ()=>{
    document.querySelector('.left').style.left = 0
    document.querySelector('.left').style.zIndex = 100
    document.querySelector('.left').style.width = "300px"
})

cross.addEventListener('click', ()=>{
    document.querySelector('.left').style.left = '-200%'
})