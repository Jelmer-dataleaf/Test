import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Meme {
  title: string;
  url: string;
  author: string;
  subreddit: string;
}

@Component({
  selector: 'app-meme-page',
  imports: [CommonModule],
  templateUrl: './meme-page.component.html',
  styleUrl: './meme-page.component.scss',
})
export class MemePageComponent implements OnInit {
  meme: Meme | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.fetchMeme();
  }

  fetchMeme() {
    this.loading = true;
    this.error = null;
    this.meme = null;

    fetch('https://meme-api.com/gimme')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch meme');
        return res.json();
      })
      .then((data: Meme) => {
        this.meme = data;
        this.loading = false;
      })
      .catch(() => {
        this.error = 'Could not load a meme. The internet is probably out of jokes.';
        this.loading = false;
      });
  }
}
