let currentAudio = null;
let currentSongIndex = 0;
let currentLi = null;
let isSeeking = false;

const playListSongsUl = document.getElementById("play-list-songs-ul");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const volumeRange = document.getElementById("volume-range");
const volumeIcon = document.getElementById("volume-icon");
const progressBar = document.getElementById("progress-bar");
const durationLabel = document.getElementById("duration");
const songNameLabel = document.getElementById("song-name");
const folders = document.querySelectorAll("#songs-folder");

let songs = [];
let songsFetched = false;
let dataIndex = 0;

const fetchSongs = async (folderName) => {
  songs = [];
  songsFetched = false;

  if (songsFetched) return;
  songsFetched = true;

  try {
    const response = await fetch(`/albums/${folderName}/`);
    const text = await response.text();

    const div = document.createElement("div");
    div.innerHTML = text;
    let links = div.getElementsByTagName("a");
    links = Array.from(links);

    playListSongsUl.innerHTML = "";
    dataIndex = 0;

    links.forEach((link) => {
      if (link.href.endsWith(".mp3")) {
        const decodedUrl = decodeURIComponent(link.href);
        const songName = decodedUrl
          .split(`/albums/${folderName}/`)[1]
          ?.replace(".mp3", "");

        if (songName) {
          songs.push({ name: songName, url: link.href });

          const li = document.createElement("li");
          dataIndex++;
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
          console.error("Error parsing song name from URL:", link.href);
        }
      }
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
  }
};

const playSong = (song, li) => {
  if (currentAudio) {
    currentAudio.pause();
    if (currentLi) {
      updateLiIcon(currentLi, "fa-pause", "fa-play");
      currentLi.classList.remove("active");
    }
  }

  currentAudio = new Audio(song.url);
  currentSongIndex = songs.findIndex((s) => s.url === song.url);
  songNameLabel.textContent = song.name;
  currentAudio.volume = volumeRange.value / 100;
  currentLi = li;

  currentLi.classList.add("active");

  currentAudio.addEventListener("loadedmetadata", () => {
    progressBar.max = currentAudio.duration;
    updateDuration();
  });
  currentAudio.addEventListener("timeupdate", updateProgress);
  currentAudio.play();

  updateLiIcon(currentLi, "fa-play", "fa-pause");
  playBtn.classList.replace("fa-play", "fa-pause");
};

const updateDuration = () => {
  if (currentAudio) {
    const totalMinutes = Math.floor(currentAudio.duration / 60);
    const totalSeconds = Math.floor(currentAudio.duration % 60);
    durationLabel.textContent = `${formatTime(
      currentAudio.currentTime
    )} / ${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
  }
};

const updateProgress = () => {
  progressBar.value = currentAudio.currentTime;
  durationLabel.textContent = formatTime(currentAudio.currentTime);

  if (currentAudio) {
    const totalMinutes = Math.floor(currentAudio.duration / 60);
    const totalSeconds = Math.floor(currentAudio.duration % 60);
    durationLabel.textContent = `${formatTime(
      currentAudio.currentTime
    )} / ${totalMinutes}:${totalSeconds < 10 ? "0" : ""}${totalSeconds}`;
  }
};

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const updateLiIcon = (li, oldIcon, newIcon) => {
  const iconElement = li.querySelector("i:last-child");
  iconElement.classList.replace(oldIcon, newIcon);
};

const togglePlayPause = () => {
  if (currentAudio.paused) {
    currentAudio.play();
    playBtn.classList.replace("fa-play", "fa-pause");
    updateLiIcon(currentLi, "fa-play", "fa-pause");
  } else {
    currentAudio.pause();
    playBtn.classList.replace("fa-pause", "fa-play");
    updateLiIcon(currentLi, "fa-pause", "fa-play");
  }
};

volumeRange.addEventListener("input", (e) => {
  const volume = e.target.value / 100;
  if (currentAudio) {
    currentAudio.volume = volume;
  }

  if (volume === 0) {
    volumeIcon.className = "fa-solid fa-volume-off";
  } else if (volume < 0.5) {
    volumeIcon.className = "fa-solid fa-volume-low";
  } else {
    volumeIcon.className = "fa-solid fa-volume-high";
  }
});

progressBar.addEventListener("mousedown", (e) => {
  if (currentAudio) {
    currentAudio.pause();
    isSeeking = true;
    playBtn.classList.replace("fa-pause", "fa-play");
    updateLiIcon(currentLi, "fa-pause", "fa-play");
  }
});

progressBar.addEventListener("mousemove", (e) => {
  if (isSeeking && currentAudio) {
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percent = offsetX / width;
    progressBar.value = percent * progressBar.max;
  }
});

progressBar.addEventListener("mouseup", (e) => {
  if (currentAudio && isSeeking) {
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percent = offsetX / width;
    const newTime = percent * currentAudio.duration;
    currentAudio.currentTime = newTime;
    currentAudio.play();
    isSeeking = false;
    playBtn.classList.replace("fa-play", "fa-pause");
    updateLiIcon(currentLi, "fa-play", "fa-pause");
  }
});

progressBar.addEventListener("touchstart", () => {
  if (currentAudio) {
    currentAudio.pause();
    isSeeking = true;
    playBtn.classList.replace("fa-pause", "fa-play");
    updateLiIcon(currentLi, "fa-pause", "fa-play");
  }
});

progressBar.addEventListener("touchmove", (e) => {
  if (isSeeking && currentAudio) {
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.touches[0].clientX - rect.left;
    const width = rect.width;
    const percent = offsetX / width;
    progressBar.value = percent * progressBar.max;
  }
});

progressBar.addEventListener("touchend", (e) => {
  if (currentAudio && isSeeking) {
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.changedTouches[0].clientX - rect.left;
    const width = rect.width;
    const percent = offsetX / width;
    const newTime = percent * currentAudio.duration;
    currentAudio.currentTime = newTime;
    currentAudio.play();
    isSeeking = false;
    playBtn.classList.replace("fa-play", "fa-pause");
    updateLiIcon(currentLi, "fa-play", "fa-pause");
  }
});

playListSongsUl.addEventListener("click", (e) => {
  const playlistItem = e.target.closest(".playlist-songs-item");

  if (playlistItem) {
    const songIndex = Array.from(playListSongsUl.children).indexOf(
      playlistItem.closest("li")
    );
    const selectedSong = songs[songIndex];
    const li = playlistItem.closest("li");

    if (
      currentAudio &&
      currentSongIndex === songIndex &&
      !currentAudio.paused
    ) {
      currentAudio.pause();
      updateLiIcon(li, "fa-pause", "fa-play");
      playBtn.classList.replace("fa-pause", "fa-play");
    } else {
      playSong(selectedSong, li);
    }
  }
});

// Previous button event
prevBtn.addEventListener("click", () => {
  if (currentSongIndex > 0) {
    currentSongIndex--;
  } else {
    currentSongIndex = songs.length - 1;
  }

  const previousSong = songs[currentSongIndex];
  const previousLi = playListSongsUl.children[currentSongIndex];
  playSong(previousSong, previousLi);
});

// Next button event
nextBtn.addEventListener("click", () => {
  if (currentSongIndex < songs.length - 1) {
    currentSongIndex++;
  } else {
    currentSongIndex = 0;
  }

  const nextSong = songs[currentSongIndex];
  const nextLi = playListSongsUl.children[currentSongIndex];
  playSong(nextSong, nextLi);
});

playBtn.addEventListener("click", togglePlayPause);

folders.forEach((folder) => {
  folder.addEventListener("click", () => {
    console.log(folder.getAttribute("data-name"));
    fetchSongs(folder.getAttribute("data-name"));
  });
});

hamburger.addEventListener("click", () => {
  document.querySelector(".left").style.left = 0;
  document.querySelector(".left").style.zIndex = 100;
  document.querySelector(".left").style.width = "300px";
});

cross.addEventListener("click", () => {
  document.querySelector(".left").style.left = "-200%";
});
