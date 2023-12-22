let justArtist = false;

async function getRecommendedTracks(artistName) {
    const clientId = 'bb02b55f6e504856ba194dc9ce441e84';
    const clientSecret = '87dc4e4e6a6142328892ac52e3c53fc1';

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        },
        body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
        throw new Error('failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    if (!searchResponse.ok) {
        throw new Error('failed to search artist');
    }

    const searchData = await searchResponse.json();
    if (!searchData.artists.items[0]) {
        throw new Error('artist not found');
    }

    const artistId = searchData.artists.items[0].id;


    if(!justArtist){
        const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=5`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });

        if (!recommendationsResponse.ok) {
            throw new Error('failed to get recommended tracks');
        }
    
        const recommendationsData = await recommendationsResponse.json();
        const recommendedTracks = recommendationsData.tracks;
    
        return recommendedTracks.map(track => ({
            name: track.name,
            albumCover: track.album.images && track.album.images[0] ? track.album.images[0].url : 'imagem não disponível',
            uri: track.uri
        }));
    }

    else{
        const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=10`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });

        if (!recommendationsResponse.ok) {
            throw new Error('failed to get recommended tracks');
        }
    
        const recommendationsData = await recommendationsResponse.json();
        const recommendedTracks = recommendationsData.tracks;
        
        const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });

        if (!artistResponse.ok) {
            throw new Error('failed to get artist details');
        }

        const artistData = await artistResponse.json();
        const originalArtistName = artistData.name;

        const allRecommendedTracks = recommendedTracks;

        const sameArtistTracks = allRecommendedTracks.filter(track => {
            const trackArtists = track.artists.map(artist => artist.name);
            return trackArtists.includes(originalArtistName);
        });

        return (sameArtistTracks.slice(0, 5)).map(track => ({
            name: track.name,
            albumCover: track.album.images && track.album.images[0] ? track.album.images[0].url : 'imagem não disponível',
            uri: track.uri
        }));
    }
}

let timeWriting;
const interval = 500;

document.getElementById('artist-name').addEventListener('input', function (event) {
    clearTimeout(timeWriting);

    timeWriting = setTimeout(async function () {
        var artistName = event.target.value;

        if(artistName === '')
        {
            const containerTracks = document.getElementById("container-tracks");
            containerTracks.textContent = '';
            selectedTracksSet.clear();

        }
        else if(artistName === 'Frank Ocean') //Ela gosta de frank ocean
        {
            const containerTracks = document.getElementById("container-tracks");
            containerTracks.textContent = 'Fiz isso aqui para você. Gosto de você. (Tudo bem se não achar tão legal)';
            containerTracks.classList.add('iluvu');
        }

        else{

            try {

                const recommendedTracks = await getRecommendedTracks(artistName);
                const containerTracks = document.getElementById("container-tracks");
                
                containerTracks.textContent = '';
                containerTracks.classList.remove('iluvu')
    
                recommendedTracks.forEach((track, index) => {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://open.spotify.com/embed/track/${(track.uri).replace("spotify:track:", "")}?utm_source=generator`; 
                    iframe.width = '100%';
                    iframe.height = '90';
                    iframe.frameBorder = '0';
                    iframe.allowfullscreen = true;
                    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
                    iframe.loading = 'lazy';
                    iframe.style.borderRadius = '12px';
                    iframe.className = 'iframe';

                    iframe.addEventListener('load', () => {
                        iframe.classList.add('loaded'); 
                    });
                
                    containerTracks.appendChild(iframe);
                });
            } catch (error) {
                console.error('Error:', error);
            }
        }
    }, interval);
});


let selectedTracksSet = new Set();

document.getElementById('reload-btn').addEventListener('click', async function () {
    var artistName = document.getElementById('artist-name').value;

    try {
        let recommendedTracks = await getRecommendedTracks(artistName);

        recommendedTracks = recommendedTracks.filter(track => !selectedTracksSet.has(track.name));

        if(justArtist){
            console.log(recommendedTracks.length)
            while (recommendedTracks.length < 5) {
                let additionalTracks = await getRecommendedTracks(artistName);

                recommendedTracks.push(...additionalTracks.filter(track => !selectedTracksSet.has(track.name)));
            }

            console.log(recommendedTracks.length)

            if(recommendedTracks.length > 5){              
                recommendedTracks.splice(5, recommendedTracks.length - 5)
            }

            console.log(recommendedTracks.length)

        }

        const containerTracks = document.getElementById("container-tracks");
        const iframes = document.querySelectorAll("iframe");

        for (let index = 0; index < iframes.length; index++) {
            containerTracks.removeChild(iframes[index]);           
        }

        recommendedTracks.forEach((track, index) => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://open.spotify.com/embed/track/${(track.uri).replace("spotify:track:", "")}?utm_source=generator`;
            iframe.width = '100%';
            iframe.height = '90';
            iframe.frameBorder = '0';
            iframe.allowfullscreen = true;
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.loading = 'lazy';
            iframe.style.borderRadius = '12px';
            iframe.className = 'iframe';

            iframe.addEventListener('load', () => {
                iframe.classList.add('loaded'); 
            });
        
            containerTracks.appendChild(iframe);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

document.getElementById("change-mode").addEventListener("click", function(){
    justArtist = !justArtist
    console.log(`${justArtist}`)
    // document.getElementById('reload-btn').click()

    
    // if(justArtist){
    //     document.getElementById("artist-name").classList.add("change")
    // }
    // else{
    //     document.getElementById("artist-name").classList.remove("change")
    // }
})

