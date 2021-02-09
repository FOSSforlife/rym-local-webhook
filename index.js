const fs = require("fs");
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const chokidar = require('chokidar');
require('dotenv').config();

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const albumListMap = (album) => `
**${album.position}. ${album.artist}** - ${album.title} (${album.primaryGenres.join(', ')} - ${album.avgRating})
${album.link}`;

chokidar.watch('./html/*.html').on('all', async (event, path) => {
  console.log(event, path);

  const webContent = fs.readFileSync('./html/Best albums of 2021 - Rate Your Music.html').toString();
  const dom = new JSDOM(webContent.substring(webContent.indexOf('<!DOCTYPE html>'), webContent.indexOf('</html>')));
  const newline = /\n/gi;

  const dateLastUpdatedStr = dom.window.document.querySelector('.page_chart_updated .dateonly').title;
  console.log(dateLastUpdatedStr);
  const updated = dateLastUpdatedStr !== fs.readFileSync('last-updated', {flag: 'a+'}).toString();
  fs.writeFileSync('last-updated', dateLastUpdatedStr);
  const itemBoxes = dom.window.document.getElementsByClassName('topcharts_itembox');
  const albums = Array.from(itemBoxes).map((el) => ({
    link: 'https://rateyourmusic.com' + el.querySelector('[href*="/release/album/"]').href,
    albumArt: 'https:' + el.querySelector('.topcharts_item_art').src,
    position: Number(el.querySelector('.topcharts_position').textContent),
    title: el.querySelector('.topcharts_item_title').textContent,
    artist: el.querySelector('.topcharts_item_artist').textContent,
    releaseDate: {
      month: el.querySelector('.topcharts_item_releasedate').textContent.split(' ')[1],
      date: Number(el.querySelector('.topcharts_item_releasedate').textContent.split(' ')[0]),
      year: Number(el.querySelector('.topcharts_item_releasedate').textContent.split(' ')[2]),
    },
    avgRating: Number(el.querySelector('.topcharts_avg_rating_stat').textContent),
    ratings: Number(el.querySelector('.topcharts_ratings_stat').textContent),
    reviews: Number(el.querySelector('.topcharts_reviews_stat').textContent),
    primaryGenres: el.querySelector('.topcharts_item_genres_container').textContent.replace(newline, '').split(',').map(str => str.trim()),
    secondaryGenres: el.querySelector('.topcharts_item_secondarygenres_container').textContent.replace(newline, '').split(',').map(str => str.trim()),
    descriptors: el.querySelector('.topcharts_item_descriptors_container').textContent.replace(newline, '').split(',').map(str => str.trim()),
    externalLinks: {
      appleMusic: el.querySelector('a[title="Apple Music"]') ? el.querySelector('a[title="Apple Music"]').href : undefined,
      bandcamp: el.querySelector('a[title="Bandcamp"]') ? el.querySelector('a[title="Bandcamp"]').href : undefined,
      soundcloud: el.querySelector('a[title="SoundCloud"]') ? el.querySelector('a[title="SoundCloud"]').href : undefined,
      spotify: el.querySelector('a[title="Spotify"]') ? el.querySelector('a[title="Spotify"]').href : undefined,
      youtube: el.querySelector('a[title="YouTube"]') ? el.querySelector('a[title="YouTube"]').href : undefined,
    }
  }));


  if(updated) {
    const dateLastUpdated = new Date(dateLastUpdatedStr);
    const truncatedDateStr = `${(dateLastUpdated.getMonth() + 1).toString().padStart(2, '0')}/${dateLastUpdated.getDate().toString().padStart(2, '0')}`;
    const header = `:cd: **RYM Weekly Chart Update ${truncatedDateStr}** :cd:\n`
    const content = header + albums.slice(0, 10).map(albumListMap).join('\n');
    console.log(content);
    axios.post(WEBHOOK_URL, { content });
  }
});
