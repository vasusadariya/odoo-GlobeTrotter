import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const destination = searchParams.get("destination")

    // Mock activity data - in a real app, this would come from a database or external API
    const mockActivities = [
      {
        id: 1,
        name: "Eiffel Tower Visit",
        description: "Iconic iron lattice tower and symbol of Paris",
        type: "destination",
        location: "Champ de Mars, Paris",
        duration: "2-3 hours",
        rating: 4.8,
        price: 25,
        currency: "EUR",
        image: "/eiffel-tower.png",
        category: "landmark",
      },
      {
        id: 2,
        name: "Louvre Museum",
        description: "World's largest art museum and historic monument",
        type: "activity",
        location: "Rue de Rivoli, Paris",
        duration: "4-6 hours",
        rating: 4.7,
        price: 17,
        currency: "EUR",
        image: "/louvre-museum.png",
        category: "museum",
      },
      {
        id: 3,
        name: "Seine River Cruise",
        description: "Scenic boat tour along the Seine River",
        type: "activity",
        location: "Seine River, Paris",
        duration: "1-2 hours",
        rating: 4.5,
        price: 15,
        currency: "EUR",
        image: "/seine-river-cruise.png",
        category: "tour",
      },
      {
        id: 4,
        name: "Montmartre Walking Tour",
        description: "Explore the artistic district of Montmartre",
        type: "activity",
        location: "Montmartre, Paris",
        duration: "3-4 hours",
        rating: 4.6,
        price: 20,
        currency: "EUR",
        image: "/montmartre-paris.png",
        category: "tour",
      },
      {
        id: 5,
        name: "French Cooking Class",
        description: "Learn to cook traditional French cuisine",
        type: "activity",
        location: "Le Marais, Paris",
        duration: "3 hours",
        rating: 4.9,
        price: 85,
        currency: "EUR",
        image: "/french-cooking-class.png",
        category: "experience",
      },
      {
        id: 6,
        name: "Palace of Versailles",
        description: "Opulent royal palace with stunning gardens",
        type: "destination",
        location: "Versailles, France",
        duration: "Full day",
        rating: 4.7,
        price: 20,
        currency: "EUR",
        image: "/versailles-palace.png",
        category: "landmark",
      },
      {
        id: 7,
        name: "Notre-Dame Cathedral",
        description: "Gothic cathedral and architectural masterpiece",
        type: "destination",
        location: "Île de la Cité, Paris",
        duration: "1-2 hours",
        rating: 4.6,
        price: 0,
        currency: "EUR",
        image: "/notre-dame-cathedral.png",
        category: "landmark",
      },
      {
        id: 8,
        name: "Champs-Élysées Shopping",
        description: "Famous avenue for shopping and dining",
        type: "activity",
        location: "Champs-Élysées, Paris",
        duration: "2-4 hours",
        rating: 4.3,
        price: 0,
        currency: "EUR",
        image: "/champs-elysees-avenue.png",
        category: "shopping",
      },
      {
        id: 9,
        name: "Sacré-Cœur Basilica",
        description: "Beautiful basilica with panoramic city views",
        type: "destination",
        location: "Montmartre, Paris",
        duration: "1-2 hours",
        rating: 4.5,
        price: 0,
        currency: "EUR",
        image: "/sacre-coeur-basilica.png",
        category: "landmark",
      },
      {
        id: 10,
        name: "Latin Quarter Food Tour",
        description: "Taste authentic French cuisine in historic quarter",
        type: "meal",
        location: "Latin Quarter, Paris",
        duration: "3 hours",
        rating: 4.8,
        price: 65,
        currency: "EUR",
        image: "/latin-quarter-food.png",
        category: "food",
      },
    ]

    // Filter activities based on query and destination
    let filteredActivities = mockActivities

    if (query) {
      filteredActivities = filteredActivities.filter(
        (activity) =>
          activity.name.toLowerCase().includes(query.toLowerCase()) ||
          activity.description.toLowerCase().includes(query.toLowerCase()) ||
          activity.category.toLowerCase().includes(query.toLowerCase()),
      )
    }

    if (destination) {
      filteredActivities = filteredActivities.filter((activity) =>
        activity.location.toLowerCase().includes(destination.toLowerCase()),
      )
    }

    return NextResponse.json({
      success: true,
      activities: filteredActivities,
      total: filteredActivities.length,
    })
  } catch (error) {
    console.error("Error searching activities:", error)
    return NextResponse.json({ success: false, error: "Failed to search activities" }, { status: 500 })
  }
}
