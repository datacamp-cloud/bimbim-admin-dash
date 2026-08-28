export type DeliveryStatus = 'En cours' | 'Livrée' | 'En attente' | 'Annulée'
export type CourierStatus = 'Disponible' | 'En livraison' | 'Hors ligne'

export const deliveries = [
  { id: 'BMB-28491', client: 'Awa Koné', phone: '+225 07 09 22 14 88', from: 'Cocody Riviera 2', to: 'Plateau, Avenue Chardy', courier: 'Yao Kouassi', status: 'En cours' as DeliveryStatus, time: 'Il y a 8 min', price: '2 500 FCFA', zone: 'Cocody' },
  { id: 'BMB-28490', client: 'Nadia Traoré', phone: '+225 05 84 16 72 01', from: 'Marcory Résidentiel', to: 'Treichville, Gare de Bassam', courier: 'Mariam Bamba', status: 'Livrée' as DeliveryStatus, time: 'Il y a 22 min', price: '1 800 FCFA', zone: 'Marcory' },
  { id: 'BMB-28489', client: 'Koffi N’Guessan', phone: '+225 01 52 88 40 11', from: 'Deux-Plateaux Vallon', to: 'Yopougon Niangon', courier: '—', status: 'En attente' as DeliveryStatus, time: 'Il y a 27 min', price: '3 200 FCFA', zone: 'Yopougon' },
  { id: 'BMB-28488', client: 'Sarah Diabaté', phone: '+225 07 08 33 91 52', from: 'Bingerville Centre', to: 'Cocody Angré 8e tranche', courier: 'Ibrahim Touré', status: 'En cours' as DeliveryStatus, time: 'Il y a 31 min', price: '2 700 FCFA', zone: 'Bingerville' },
  { id: 'BMB-28487', client: 'Jean-Marc N’Dri', phone: '+225 05 65 42 10 77', from: 'Abobo Baoulé', to: 'Adjamé Liberté', courier: 'Fatou Soro', status: 'Annulée' as DeliveryStatus, time: 'Il y a 44 min', price: '1 500 FCFA', zone: 'Abobo' },
  { id: 'BMB-28486', client: 'Prisca Yao', phone: '+225 07 77 19 03 64', from: 'Plateau Dokui', to: 'Marcory Zone 4', courier: 'Serge Koffi', status: 'Livrée' as DeliveryStatus, time: 'Il y a 51 min', price: '2 100 FCFA', zone: 'Plateau' },
]

export const couriers = [
  { id: 'CR-0184', name: 'Yao Kouassi', initials: 'YK', zone: 'Cocody', status: 'En livraison' as CourierStatus, deliveries: 8, rating: '4.9', activity: 'Il y a 4 min' },
  { id: 'CR-0162', name: 'Mariam Bamba', initials: 'MB', zone: 'Marcory', status: 'Disponible' as CourierStatus, deliveries: 12, rating: '4.8', activity: 'Il y a 2 min' },
  { id: 'CR-0201', name: 'Ibrahim Touré', initials: 'IT', zone: 'Bingerville', status: 'En livraison' as CourierStatus, deliveries: 6, rating: '4.7', activity: 'Il y a 7 min' },
  { id: 'CR-0148', name: 'Fatou Soro', initials: 'FS', zone: 'Abobo', status: 'Hors ligne' as CourierStatus, deliveries: 9, rating: '4.9', activity: 'Il y a 2 h' },
  { id: 'CR-0193', name: 'Serge Koffi', initials: 'SK', zone: 'Plateau', status: 'Disponible' as CourierStatus, deliveries: 11, rating: '4.6', activity: 'Il y a 5 min' },
]

export const users = [
  { name: 'Awa Koné', email: 'awa.kone@email.ci', phone: '+225 07 09 22 14 88', deliveries: 14, status: 'Actif', joined: '12 juin 2026' },
  { name: 'Nadia Traoré', email: 'nadia.t@email.ci', phone: '+225 05 84 16 72 01', deliveries: 8, status: 'Actif', joined: '09 juin 2026' },
  { name: 'Koffi N’Guessan', email: 'koffi.ng@email.ci', phone: '+225 01 52 88 40 11', deliveries: 3, status: 'Actif', joined: '04 juin 2026' },
  { name: 'Sarah Diabaté', email: 'sarah.d@email.ci', phone: '+225 07 08 33 91 52', deliveries: 21, status: 'Actif', joined: '28 mai 2026' },
]

export const notifications = [
  { category: 'Livraison', title: 'Livraison en attente', description: 'BMB-28489 attend une attribution depuis 27 minutes.', date: 'Il y a 4 min', unread: true },
  { category: 'Coursier', title: 'Coursier hors ligne', description: 'Fatou Soro est hors ligne dans une zone à forte demande.', date: 'Il y a 18 min', unread: true },
  { category: 'Système', title: 'Rapport quotidien disponible', description: 'Le rapport d’activité du 27 août est prêt à consulter.', date: 'Hier, 18:40', unread: false },
]

export const timeline = [
  { label: 'Commande créée', time: '27 août, 14:02', done: true },
  { label: 'Coursier assigné', time: '27 août, 14:07', done: true },
  { label: 'Colis récupéré', time: '27 août, 14:18', done: true },
  { label: 'En route', time: '27 août, 14:22', done: true },
  { label: 'Livrée', time: 'En attente', done: false },
]

export const kpis = [
  { label: 'Livraisons aujourd’hui', value: '128', change: '+12,4%', detail: 'vs. hier', tone: 'green' },
  { label: 'Livraisons en cours', value: '24', change: '7', detail: 'nécessitent une attention', tone: 'orange' },
  { label: 'Coursiers actifs', value: '46', change: '82', detail: 'au total', tone: 'blue' },
  { label: 'Temps moyen', value: '34 min', change: '−6 min', detail: 'cette semaine', tone: 'green' },
]
