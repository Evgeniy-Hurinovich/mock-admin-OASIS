import { isFuture, isPast, isToday } from 'date-fns'
import { bookings as rawBookings } from '../../data/data-bookings.js'
import { cabins as rawCabins } from '../../data/data-cabins.js'
import { guests as rawGuests } from '../../data/data-guests.js'
import { subtractDates, getToday } from '../../utils/helpers.js'
import { PAGE_SIZE, DEMO_EMAIL, DEMO_PASSWORD } from '../../utils/constants.js'

const STORE_KEY = 'asmary-demo-store'
const SESSION_KEY = 'asmary-demo-session'

export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildInitialStore() {
  const guests = rawGuests.map((guest, index) => ({ ...guest, id: index + 1 }))
  const cabins = rawCabins.map((cabin, index) => ({ ...cabin, id: index + 1 }))

  const bookings = rawBookings.map((booking, index) => {
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
      id: index + 1,
      numNights,
      cabinPrice,
      extrasPrice,
      totalPrice,
      guestId: guests.at(booking.guestId - 1).id,
      cabinId: cabins.at(booking.cabinId - 1).id,
      status,
    }
  })

  return {
    guests,
    cabins,
    bookings,
    settings: {
      id: 1,
      minBookingLength: 3,
      maxBookingLength: 30,
      maxGuestsPerBooking: 10,
      breakfastPrice: 15,
    },
    nextCabinId: cabins.length + 1,
    nextBookingId: bookings.length + 1,
  }
}

export function loadStore() {
  const saved = localStorage.getItem(STORE_KEY)
  if (saved) return JSON.parse(saved)

  const store = buildInitialStore()
  saveStore(store)
  return store
}

export function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function getDemoUser() {
  return {
    id: 'demo-admin',
    email: DEMO_EMAIL,
    role: 'authenticated',
    user_metadata: {
      fullName: 'Kwazi',
      avatar: '',
    },
  }
}

function getCabin(store, cabinId) {
  return store.cabins.find((cabin) => cabin.id === cabinId)
}

function getGuest(store, guestId) {
  return store.guests.find((guest) => guest.id === guestId)
}

function withListRelations(booking, store) {
  const cabin = getCabin(store, booking.cabinId)
  const guest = getGuest(store, booking.guestId)

  return {
    ...booking,
    cabins: cabin ? { name: cabin.name } : null,
    guests: guest
      ? { fullName: guest.fullName, email: guest.email }
      : null,
  }
}

function withFullRelations(booking, store) {
  return {
    ...booking,
    cabins: getCabin(store, booking.cabinId) || null,
    guests: getGuest(store, booking.guestId) || null,
  }
}

function sortBookings(bookings, sortBy) {
  if (!sortBy) return bookings

  return [...bookings].sort((a, b) => {
    const left = a[sortBy.field]
    const right = b[sortBy.field]

    if (left === right) return 0
    if (sortBy.direction === 'asc') return left > right ? 1 : -1
    return left < right ? 1 : -1
  })
}

function filterBookings(bookings, filter) {
  if (!filter) return bookings

  if (filter.method === 'gte') {
    return bookings.filter((booking) => booking[filter.field] >= filter.value)
  }

  return bookings.filter((booking) => booking[filter.field] === filter.value)
}

function paginate(items, page) {
  const from = (page - 1) * PAGE_SIZE
  return items.slice(from, from + PAGE_SIZE)
}

function resolveImage(image) {
  if (image instanceof File) return URL.createObjectURL(image)
  return image
}

function sameDay(left, right) {
  return String(left).slice(0, 10) === String(right).slice(0, 10)
}

export const demoApi = {
  async login({ email, password }) {
    await delay()
    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      throw new Error('Invalid login credentials')
    }

    const user = getDemoUser()
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    return { user, session: { access_token: 'demo' } }
  },

  async signup() {
    await delay()
    throw new Error('Регистрация недоступна в демо-режиме')
  },

  async getCurrentUser() {
    await delay(100)
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  },

  async logout() {
    await delay(100)
    localStorage.removeItem(SESSION_KEY)
  },

  async updateCurrentUser({ password, fullName, avatar }) {
    await delay()
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) throw new Error('Not authenticated')

    const user = JSON.parse(stored)

    if (fullName) {
      user.user_metadata.fullName = fullName
    }

    if (avatar instanceof File) {
      user.user_metadata.avatar = URL.createObjectURL(avatar)
    }

    if (password) {
      // Password changes are ignored in demo mode.
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    return { user }
  },

  async getCabins() {
    await delay()
    return loadStore().cabins
  },

  async createEditCabin(newCabin, id) {
    await delay()
    const store = loadStore()
    const image = resolveImage(newCabin.image)
    const cabinPayload = { ...newCabin, image }

    if (!id) {
      const cabin = { ...cabinPayload, id: store.nextCabinId }
      store.nextCabinId += 1
      store.cabins.push(cabin)
      saveStore(store)
      return cabin
    }

    const index = store.cabins.findIndex((cabin) => cabin.id === id)
    if (index === -1) throw new Error('Предложение не было создано')

    const cabin = { ...store.cabins[index], ...cabinPayload, id }
    store.cabins[index] = cabin
    saveStore(store)
    return cabin
  },

  async deleteCabin(id) {
    await delay()
    const store = loadStore()
    store.cabins = store.cabins.filter((cabin) => cabin.id !== id)
    saveStore(store)
    return { id }
  },

  async getBookings({ filter, sortBy, page }) {
    await delay()
    const store = loadStore()
    const filtered = filterBookings(store.bookings, filter)
    const sorted = sortBookings(filtered, sortBy)
    const count = sorted.length
    const data = paginate(sorted, page).map((booking) =>
      withListRelations(booking, store)
    )

    return { data, count }
  },

  async getBooking(id) {
    await delay()
    const store = loadStore()
    const booking = store.bookings.find((item) => item.id === Number(id))
    if (!booking) throw new Error('Бронирование не найдено')
    return withFullRelations(booking, store)
  },

  async getBookingsAfterDate(date) {
    await delay()
    const end = getToday({ end: true })
    return loadStore()
      .bookings.filter(
        (booking) => booking.created_at >= date && booking.created_at <= end
      )
      .map(({ created_at, totalPrice, extrasPrice }) => ({
        created_at,
        totalPrice,
        extrasPrice,
      }))
  },

  async getStaysAfterDate(date) {
    await delay()
    const today = getToday()
    const store = loadStore()

    return store.bookings
      .filter(
        (booking) => booking.startDate >= date && booking.startDate <= today
      )
      .map((booking) => ({
        ...booking,
        guests: getGuest(store, booking.guestId),
      }))
  },

  async getStaysTodayActivity() {
    await delay()
    const today = getToday()
    const store = loadStore()

    return store.bookings
      .filter(
        (booking) =>
          (booking.status === 'unconfirmed' &&
            sameDay(booking.startDate, today)) ||
          (booking.status === 'checked-in' && sameDay(booking.endDate, today))
      )
      .map((booking) => {
        const guest = getGuest(store, booking.guestId)
        return {
          ...booking,
          guests: guest
            ? {
                fullName: guest.fullName,
                nationality: guest.nationality,
                countryFlag: guest.countryFlag,
              }
            : null,
        }
      })
  },

  async updateBooking(id, obj) {
    await delay()
    const store = loadStore()
    const index = store.bookings.findIndex(
      (booking) => booking.id === Number(id)
    )
    if (index === -1) throw new Error('Бронирование не может быть обновлено.')

    const booking = { ...store.bookings[index], ...obj, id: Number(id) }
    store.bookings[index] = booking
    saveStore(store)
    return booking
  },

  async deleteBooking(id) {
    await delay()
    const store = loadStore()
    store.bookings = store.bookings.filter(
      (booking) => booking.id !== Number(id)
    )
    saveStore(store)
    return { id: Number(id) }
  },

  async getSettings() {
    await delay()
    return loadStore().settings
  },

  async updateSetting(newSetting) {
    await delay()
    const store = loadStore()
    store.settings = { ...store.settings, ...newSetting }
    saveStore(store)
    return store.settings
  },
}
