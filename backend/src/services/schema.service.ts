export class SchemaService {
  /**
   * Generates a standard Schema.org JSON-LD structure for the Restaurant.
   */
  generateRestaurantSchema(restaurant: any): any {
    const address: any = {
      "@type": "PostalAddress",
      "streetAddress": restaurant.address,
      "addressLocality": restaurant.city,
      "addressRegion": restaurant.state || undefined,
      "postalCode": restaurant.postalCode || undefined,
      "addressCountry": "US"
    };

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": `${restaurant.website || 'https://rdi-platform.local'}/#restaurant`,
      "name": restaurant.name,
      "address": address,
      "servesCuisine": restaurant.cuisineTypes,
      "priceRange": restaurant.priceRange || "$$",
      "telephone": restaurant.phone || undefined,
      "url": restaurant.website || undefined,
    };

    if (restaurant.latitude && restaurant.longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": restaurant.latitude,
        "longitude": restaurant.longitude
      };
    }

    // Convert timings if present
    if (restaurant.timings) {
      schema.openingHoursSpecification = this.formatOpeningHours(restaurant.timings);
    }

    return schema;
  }

  /**
   * Generates a standard Schema.org FoodMenu JSON-LD.
   */
  generateMenuSchema(restaurantName: string, sections: any[], items: any[]): any {
    const menuSectionMap = new Map<string, any[]>();
    
    // Group items by section
    items.forEach(item => {
      const sectionName = item.section?.name || 'General';
      if (!menuSectionMap.has(sectionName)) {
        menuSectionMap.set(sectionName, []);
      }

      const suitableForDiet: string[] = [];
      if (item.dietaryType) {
        item.dietaryType.forEach((diet: string) => {
          if (diet.toLowerCase().includes('vegan')) {
            suitableForDiet.push("https://schema.org/VeganDiet");
          } else if (diet.toLowerCase().includes('vegetarian')) {
            suitableForDiet.push("https://schema.org/VegetarianDiet");
          } else if (diet.toLowerCase().includes('gluten-free') || diet.toLowerCase().includes('gluten free')) {
            suitableForDiet.push("https://schema.org/GlutenFreeDiet");
          } else if (diet.toLowerCase().includes('halal')) {
            suitableForDiet.push("https://schema.org/HalalDiet");
          } else if (diet.toLowerCase().includes('kosher')) {
            suitableForDiet.push("https://schema.org/KosherDiet");
          }
        });
      }

      menuSectionMap.get(sectionName)!.push({
        "@type": "MenuItem",
        "name": item.name,
        "description": item.description || undefined,
        "offers": {
          "@type": "Offer",
          "price": item.price,
          "priceCurrency": item.currency || "USD"
        },
        "suitableForDiet": suitableForDiet.length > 0 ? suitableForDiet : undefined
      });
    });

    const hasMenuSection = sections.map(sec => {
      return {
        "@type": "MenuSection",
        "name": sec.name,
        "description": sec.description || undefined,
        "hasMenuItem": menuSectionMap.get(sec.name) || []
      };
    });

    return {
      "@context": "https://schema.org",
      "@type": "FoodMenu",
      "name": `Menu for ${restaurantName}`,
      "hasMenuSection": hasMenuSection
    };
  }

  /**
   * Generates FAQPage JSON-LD.
   */
  generateFAQSchema(faqs: any[]): any {
    const mainEntity = faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }));

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": mainEntity
    };
  }

  /**
   * Generates a single, combined schema wrapper for search crawlers.
   */
  generateCombinedSchema(restaurant: any, sections: any[], items: any[], faqs: any[]): any {
    const restaurantSchema = this.generateRestaurantSchema(restaurant);
    
    // Embed the Menu directly in the Restaurant schema
    restaurantSchema.hasMenu = this.generateMenuSchema(restaurant.name, sections, items);

    // Create a graph containing both Restaurant (with embedded Menu) and FAQPage
    return {
      "@context": "https://schema.org",
      "@graph": [
        restaurantSchema,
        this.generateFAQSchema(faqs)
      ]
    };
  }

  /**
   * Formats weekly timing configuration to Schema.org openingHoursSpecification
   */
  private formatOpeningHours(timings: any): any[] {
    // Simple parser for timings object
    // Assuming format: { "Monday": "11:30 AM - 10:00 PM", ... }
    const daysMap: { [key: string]: string } = {
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
    };

    const specs: any[] = [];

    try {
      Object.keys(timings).forEach(day => {
        const standardDay = daysMap[day.toLowerCase()];
        if (!standardDay) return;

        const timeRange = timings[day]; // e.g. "11:30 AM - 10:00 PM" or "Closed"
        if (timeRange.toLowerCase() === 'closed') return;

        const parts = timeRange.split('-');
        if (parts.length === 2) {
          const opens = this.convertTo24h(parts[0].trim());
          const closes = this.convertTo24h(parts[1].trim());

          specs.push({
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              `https://schema.org/${standardDay}`
            ],
            "opens": opens,
            "closes": closes
          });
        }
      });
    } catch (e) {
      console.warn("Could not parse timings for Schema.org representation:", e);
    }

    return specs;
  }

  /**
   * Helper to convert "11:30 AM" to "11:30" or "10:00 PM" to "22:00"
   */
  private convertTo24h(timeStr: string): string {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "00:00";

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
}

export const schemaService = new SchemaService();
