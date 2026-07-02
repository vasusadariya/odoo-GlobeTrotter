import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../models/User"

// For handling location updates from the client
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { latitude, longitude, city, area, country } = await request.json()

    await connectDB()

    // Update the user with the new location data
    await User.findByIdAndUpdate(session.user.id, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        city,
        area,
        country,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Location update error:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

// For reverse geocoding - gets location name from coordinates
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    // First try Google Maps API if you have a key
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const googleResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}`
        );
        
        if (googleResponse.ok) {
          const data = await googleResponse.json();
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            // Extract city, area, and country from address components
            let city = '';
            let area = '';
            let country = '';
            
            for (const component of data.results[0].address_components) {
              if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
              } else if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                area = component.long_name;
              } else if (component.types.includes('country')) {
                country = component.long_name;
              }
            }
            
            return NextResponse.json({
              city,
              area,
              country,
              formatted_address: data.results[0].formatted_address
            });
          }
        }
      } catch (error) {
        console.error('Google Maps API error:', error);
        // Continue to fallback
      }
    }
    
    // Fallback to Nominatim if Google Maps failed or is not configured
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'GlobeTrotter/1.0' // Required by Nominatim ToS
          }
        }
      );
      
      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();
        
        return NextResponse.json({
          city: data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown',
          area: data.address.suburb || data.address.neighbourhood || data.address.road || '',
          country: data.address.country || 'Unknown'
        });
      } else {
        throw new Error('Nominatim API failed');
      }
    } catch (nominatimError) {
      console.error('Nominatim API error:', nominatimError);
      throw new Error('All geocoding services failed');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to determine location name',
        city: 'Unknown Location',
        area: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
        country: ''
      }, 
      { status: 200 } // Return 200 with fallback data
    );
  }
}