import supabase from './supabase'
import { DEMO_MODE } from '../utils/constants'
import { demoApi } from './demo/store'

export async function getSettings() {
  if (DEMO_MODE) return demoApi.getSettings()

  const { data, error } = await supabase.from('settings').select('*').single()

  if (error) {
    console.error(error)
    throw new Error('Settings could not be loaded')
  }
  return data
}

export async function updateSetting(newSetting) {
  if (DEMO_MODE) return demoApi.updateSetting(newSetting)

  const { data, error } = await supabase
    .from('settings')
    .update(newSetting)
    .eq('id', 1)
    .single()

  if (error) {
    console.error(error)
    throw new Error('Settings could not be updated')
  }
  return data
}
