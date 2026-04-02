import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type MenuSection = {
  id: string
  name: string
  order_index: number
  created_at: string
}

export type SectionImage = {
  id: string
  section_id: string
  image_url: string
  link_url: string | null
  column_index: number
  order_index: number
}

export type Page = {
  id: string
  section_id: string | null
  title: string
  notion_url: string | null
  order_index: number
}
