import { createClient } from '@supabase/supabase-js'
import { isFuture, isPast, isToday } from 'date-fns'
import { bookings } from '../src/data/data-bookings.js'
import { cabins } from '../src/data/data-cabins.js'
import { guests } from '../src/data/data-guests.js'

const supabaseUrl = 'https://ibameynehrwshrtlabjv.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYW1leW5laHJ3c2hydGxhYmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzkyMDEsImV4cCI6MjA1NjQxNTIwMX0.O7Fdae28PqIb0bHreuaumL3tCzVRIHJJq3I-fLQ5QdY'

const supabase = createClient(supabaseUrl, supabaseKey)

function subtractDates(dateStr1, dateStr2) {
  return (
    (new Date(dateStr1).getTime() - new Date(dateStr2).getTime()) /
    (1000 * 60 * 60 * 24)
  )
}

async function deleteGuests() {
  const { error } = await supabase.from('guests').delete().gt('id', 0)
  if (error) throw new Error(`delete guests: ${error.message}`)
}

async function deleteCabins() {
  const { error } = await supabase.from('cabins').delete().gt('id', 0)
  if (error) throw new Error(`delete cabins: ${error.message}`)
}

async function deleteBookings() {
  const { error } = await supabase.from('bookings').delete().gt('id', 0)
  if (error) throw new Error(`delete bookings: ${error.message}`)
}

async function createGuests() {
  const { error } = await supabase.from('guests').insert(guests)
  if (error) throw new Error(`create guests: ${error.message}`)
}

async function createCabins() {
  const { error } = await supabase.from('cabins').insert(cabins)
  if (error) throw new Error(`create cabins: ${error.message}`)
}

async function createBookings() {
  const { data: guestsIds, error: guestsError } = await supabase
    .from('guests')
    .select('id')
    .order('id')
  if (guestsError) throw new Error(`fetch guests: ${guestsError.message}`)

  const allGuestIds = guestsIds.map((guest) => guest.id)

  const { data: cabinsIds, error: cabinsError } = await supabase
    .from('cabins')
    .select('id')
    .order('id')
  if (cabinsError) throw new Error(`fetch cabins: ${cabinsError.message}`)

  const allCabinIds = cabinsIds.map((cabin) => cabin.id)

  const finalBookings = bookings.map((booking) => {
    const cabin = cabins.at(booking.cabinId - 1)
    const numNights = subtractDates(booking.endDate, booking.startDate)
    const cabinPrice = numNights * (cabin.regularPrice - cabin.discount)
    const extrasPrice = booking.hasBreakfast
      ? numNights * 15 * booking.numGuests
      : 0
    const totalPrice = cabinPrice + extrasPrice

    let status
    if (
      isPast(new Date(booking.endDate)) &&
      !isToday(new Date(booking.endDate))
    )
      status = 'checked-out'
    if (
      isFuture(new Date(booking.startDate)) ||
      isToday(new Date(booking.startDate))
    )
      status = 'unconfirmed'
    if (
      (isFuture(new Date(booking.endDate)) ||
        isToday(new Date(booking.endDate))) &&
      isPast(new Date(booking.startDate)) &&
      !isToday(new Date(booking.startDate))
    )
      status = 'checked-in'

    return {
      ...booking,
      numNights,
      cabinPrice,
      extrasPrice,
      totalPrice,
      guestId: allGuestIds.at(booking.guestId - 1),
      cabinId: allCabinIds.at(booking.cabinId - 1),
      status,
    }
  })

  const { error } = await supabase.from('bookings').insert(finalBookings)
  if (error) throw new Error(`create bookings: ${error.message}`)
}

async function seed() {
  console.log('Seeding Supabase database...')

  await deleteBookings()
  await deleteGuests()
  await deleteCabins()

  await createGuests()
  await createCabins()
  await createBookings()

  console.log('Done: guests, cabins, and bookings uploaded.')
}

seed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
