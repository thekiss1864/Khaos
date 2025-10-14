/**
 * Riot Data Dragon API Service
 * Used to fetch champion data, skins, and icons
 */

export interface ChampionData {
  type: string;
  format: string;
  version: string;
  data: {
    [key: string]: Champion;
  };
}

export interface Champion {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
  };
  skins: Skin[];
}

export interface Skin {
  id: string;
  num: number;
  name: string;
  chromas: boolean;
}

export interface SummonerIcon {
  id: number;
  title: string;
  imagePath: string;
  keywords?: string[];
}

class RiotApiService {
  private baseUrl = 'https://ddragon.leagueoflegends.com';
  private currentVersion: string = '14.1.1'; // Default fallback version

  /**
   * Get the current game version
   */
  async getVersion(): Promise<string> {
    if (this.currentVersion !== '14.1.1') {
      return this.currentVersion;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/versions.json`);
      const versions = await response.json();
      this.currentVersion = versions[0];
      return this.currentVersion;
    } catch (error) {
      console.error('Failed to fetch version:', error);
      return this.currentVersion; // Return fallback version
    }
  }

  /**
   * Get all champions data
   */
  async getChampions(): Promise<ChampionData> {
    const version = await this.getVersion();
    try {
      const response = await fetch(
        `${this.baseUrl}/cdn/${version}/data/en_US/champion.json`
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch champions:', error);
      throw error;
    }
  }

  /**
   * Get champion icons for background selection
   */
  async getChampionIcons(): Promise<Array<{ src: string; alt: string; id: string; numericalId: string }>> {
    const version = await this.getVersion();
    const championData = await this.getChampions();

    const icons = [];
    for (const championKey in championData.data) {
      const champion = championData.data[championKey];
      icons.push({
        src: `${this.baseUrl}/cdn/${version}/img/champion/${champion.id}.png`,
        alt: champion.name,
        id: champion.id, // Keep name for backward compatibility
        numericalId: champion.key, // Add numerical ID for LCU API
      });
    }

    return icons;
  }

  /**
   * Get skins for a specific champion
   */
  async getChampionSkins(championId: string): Promise<Skin[]> {
    const version = await this.getVersion();
    try {
      const response = await fetch(
        `${this.baseUrl}/cdn/${version}/data/en_US/champion/${championId}.json`
      );
      const data = await response.json();
      return data.data[championId].skins;
    } catch (error) {
      console.error('Failed to fetch champion skins:', error);
      throw error;
    }
  }

  /**
   * Get skin images for a champion
   */
  async getSkinImages(championId: string): Promise<Array<{ src: string; alt: string; id: string }>> {
    const skins = await this.getChampionSkins(championId);
    
    return skins.map(skin => ({
      src: `${this.baseUrl}/cdn/img/champion/loading/${championId}_${skin.num}.jpg`,
      alt: skin.name || `${championId} Skin ${skin.num}`,
      id: skin.id,
    }));
  }

  /**
   * Get summoner icons (mock data - replace with actual API if available)
   * Note: Riot doesn't provide a comprehensive summoner icons API
   * You may need to manually curate this list or scrape it
   */
  async getSummonerIcons(): Promise<SummonerIcon[]> {
    // This is a simplified version. In production, you'd want to fetch this from a more complete source
    const version = await this.getVersion();
    const icons: SummonerIcon[] = [];
    
    // Comprehensive icon titles with multiple searchable keywords
    const iconTitles: Record<number, { title: string; keywords: string[] }> = {
      1: { 
        title: "Default League of Legends Summoner Icon", 
        keywords: ["default", "standard", "basic", "original", "starter"] 
      },
      29: { 
        title: "Poro Cute Fluffy Companion Icon", 
        keywords: ["poro", "cute", "fluffy", "companion", "league", "mascot"] 
      },
      50: { 
        title: "Arcade Retro Gaming Pixel Style Icon", 
        keywords: ["arcade", "retro", "gaming", "pixel", "8-bit", "classic", "video game"] 
      },
      51: { 
        title: "Arcade Minion Pixel Character Icon", 
        keywords: ["arcade", "minion", "pixel", "character", "game", "8-bit"] 
      },
      52: { 
        title: "Arcade Caster Minion Pixel Warrior Icon", 
        keywords: ["arcade", "caster", "minion", "pixel", "warrior", "magic"] 
      },
      53: { 
        title: "Arcade Melee Minion Pixel Fighter Icon", 
        keywords: ["arcade", "melee", "minion", "pixel", "fighter", "combat"] 
      },
      54: { 
        title: "Arcade Siege Minion Pixel Defender Icon", 
        keywords: ["arcade", "siege", "minion", "pixel", "defender", "tank"] 
      },
      55: { 
        title: "Arcade Super Minion Pixel Champion Icon", 
        keywords: ["arcade", "super", "minion", "pixel", "champion", "powerful"] 
      },
      56: { 
        title: "Arcade Nexus Pixel Base Icon", 
        keywords: ["arcade", "nexus", "pixel", "base", "core", "home"] 
      },
      57: { 
        title: "Arcade Turret Pixel Defense Icon", 
        keywords: ["arcade", "turret", "pixel", "defense", "tower", "protect"] 
      },
      58: { 
        title: "Arcade Inhibitor Pixel Structure Icon", 
        keywords: ["arcade", "inhibitor", "pixel", "structure", "base", "defense"] 
      },
      59: { 
        title: "Arcade Jungle Pixel Environment Icon", 
        keywords: ["arcade", "jungle", "pixel", "environment", "map", "terrain"] 
      },
      60: { 
        title: "Arcade River Pixel Landscape Icon", 
        keywords: ["arcade", "river", "pixel", "landscape", "water", "map"] 
      },
      61: { 
        title: "Arcade Dragon Pixel Monster Icon", 
        keywords: ["arcade", "dragon", "pixel", "monster", "epic", "creature"] 
      },
      62: { 
        title: "Arcade Baron Pixel Legendary Monster Icon", 
        keywords: ["arcade", "baron", "pixel", "monster", "legendary", "powerful"] 
      },
      63: { 
        title: "Arcade Rift Herald Pixel Creature Icon", 
        keywords: ["arcade", "rift herald", "pixel", "creature", "monster", "unique"] 
      },
      64: { 
        title: "Arcade Scuttle Crab Pixel Creature Icon", 
        keywords: ["arcade", "scuttle crab", "pixel", "creature", "neutral", "map"] 
      },
      65: { 
        title: "Arcade Gromp Pixel Jungle Monster Icon", 
        keywords: ["arcade", "gromp", "pixel", "jungle", "monster", "neutral"] 
      },
      66: { 
        title: "Arcade Blue Sentinel Pixel Buff Icon", 
        keywords: ["arcade", "blue sentinel", "pixel", "buff", "jungle", "blue"] 
      },
      67: { 
        title: "Arcade Red Brambleback Pixel Buff Icon", 
        keywords: ["arcade", "red brambleback", "pixel", "buff", "jungle", "red"] 
      },
      68: { 
        title: "Arcade Krugs Pixel Jungle Monster Icon", 
        keywords: ["arcade", "krugs", "pixel", "jungle", "monster", "neutral"] 
      },
      69: { 
        title: "Arcade Raptors Pixel Jungle Monster Icon", 
        keywords: ["arcade", "raptors", "pixel", "jungle", "monster", "neutral"] 
      },
      70: { 
        title: "Arcade Wolves Pixel Jungle Monster Icon", 
        keywords: ["arcade", "wolves", "pixel", "jungle", "monster", "neutral"] 
      },
      71: { 
        title: "Arcade Pixel Art Classic Icon", 
        keywords: ["arcade", "pixel", "art", "classic", "retro", "8-bit"] 
      },
      72: { 
        title: "Arcade 8-Bit Pixel Gaming Icon", 
        keywords: ["arcade", "8-bit", "pixel", "gaming", "retro", "classic"] 
      },
      73: { 
        title: "Arcade Retro Gaming Pixel Style Icon", 
        keywords: ["arcade", "retro", "gaming", "pixel", "style", "classic"] 
      },
      74: { 
        title: "Arcade Joystick Pixel Gaming Icon", 
        keywords: ["arcade", "joystick", "pixel", "gaming", "controller", "play"] 
      },
      75: { 
        title: "Arcade Console Pixel Gaming System Icon", 
        keywords: ["arcade", "console", "pixel", "gaming", "system", "play"] 
      },
      76: { 
        title: "Arcade Pixel Heart Gaming Love Icon", 
        keywords: ["arcade", "pixel", "heart", "love", "gaming", "passion"] 
      },
      77: { 
        title: "Arcade Power-Up Pixel Boost Icon", 
        keywords: ["arcade", "power-up", "pixel", "boost", "upgrade", "level"] 
      },
      78: { 
        title: "Arcade Game Over Pixel End Screen Icon", 
        keywords: ["arcade", "game over", "pixel", "end", "screen", "finish"] 
      }
    };
    
    for (let i = 1; i <= 100; i++) {
      const iconData = iconTitles[i];
      icons.push({
        id: i,
        title: iconData?.title || `Icon ${i}`,
        imagePath: `${this.baseUrl}/cdn/${version}/img/profileicon/${i}.png`,
        keywords: iconData?.keywords
      });
    }
    
    return icons;
  }

  /**
   * Get summoner icon URL by ID
   */
  async getSummonerIconUrl(iconId: number): Promise<string> {
    const version = await this.getVersion();
    return `${this.baseUrl}/cdn/${version}/img/profileicon/${iconId}.png`;
  }

  /**
   * Get champion splash art URL
   */
  getChampionSplash(championId: string, skinNum: number = 0): string {
    return `${this.baseUrl}/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
  }

  /**
   * Get champion loading screen art URL
   */
  getChampionLoading(championId: string, skinNum: number = 0): string {
    return `${this.baseUrl}/cdn/img/champion/loading/${championId}_${skinNum}.jpg`;
  }
}

export const riotApi = new RiotApiService();

