import supabase, { supabaseUrl } from './supabase'
import { DEMO_MODE } from '../utils/constants'
import { demoApi } from './demo/store'

export async function getCabins() {
  if (DEMO_MODE) return demoApi.getCabins()

  const { data, error } = await supabase.from('cabins').select('*')
  if (error) {
    console.error(error)
    throw new Error('Предложение не может быть загружено')
  }
  return data
}

export async function createEditCabin(newCabin, id) {
  if (DEMO_MODE) return demoApi.createEditCabin(newCabin, id)

  const hasImagePath = newCabin.image?.startsWith?.(supabaseUrl)

  const imageName = `${Math.random()}-${newCabin.image.name}`.replaceAll(
    '/',
    ''
  )
  const imagePath = hasImagePath
    ? newCabin.image
    : `${supabaseUrl}/storage/v1/object/public/house-images/${imageName}`

  let query = supabase.from('cabins')

  if (!id) query = query.insert([{ ...newCabin, image: imagePath }])

  if (id) query = query.update({ ...newCabin, image: imagePath }).eq('id', id)

  const { data, error } = await query.select().single()

  if (error) {
    console.error(error)
    throw new Error('Предложение не было создано')
  }

  if (hasImagePath) return data

  const { error: storageError } = await supabase.storage
    .from('house-images')
    .upload(imageName, newCabin.image)

  if (storageError) {
    await supabase.from('cabins').delete().eq('id', data.id)
    console.error(storageError)
    throw new Error(
      'Фото домика не было загружено, предложение не было создано'
    )
  }

  return data
}

export async function deleteCabin(id) {
  if (DEMO_MODE) return demoApi.deleteCabin(id)

  const { data, error } = await supabase.from('cabins').delete().eq('id', id)

  if (error) {
    console.error(error)
    throw new Error('Cabin could not be deleted')
  }

  return data
}
