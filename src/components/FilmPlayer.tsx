'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Film } from '@/config/portfolio'
import { VideoLightbox } from './VideoLightbox'

const FilmPlayerContext = createContext<(film: Film) => void>(() => {})

/** Lets any FilmCard on the page open the shared full-screen player. */
export function FilmPlayerProvider({ children }: { children: ReactNode }) {
  const [film, setFilm] = useState<Film | null>(null)
  return (
    <FilmPlayerContext.Provider value={setFilm}>
      {children}
      <VideoLightbox film={film} onClose={() => setFilm(null)} />
    </FilmPlayerContext.Provider>
  )
}

export function useOpenFilm() {
  return useContext(FilmPlayerContext)
}
