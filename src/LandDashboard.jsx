import React, { useEffect, useState } from "react";

	{/* making the icons on click on active */}
function GeographyIcon({ geography, isActive, onClick }) {
  const geographyLower = geography.toLowerCase();
  return (
    <div 
      className={`geography-icon ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={geography}
      style={{
        width: '30px',
        height: '30px',
        display: 'inline-block',
        margin: '0 2px' // Add this for spacing
      }}
    >
      <img 
        src={`https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/${geographyLower}${isActive ? 'On' : 'Off'}.svg`} 
        alt={geography}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}

function TotemIcon({ type, isActive, onClick }) {
  const totemImages = {
    common: "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_1_common_300.png",
    rare: "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_2_rare_300.png",
    epic: "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_3_epic_300.png",
    legendary: "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_4_legendary_300.png",
  };

  return (
    <div 
      className={`totem-icon ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={type.charAt(0).toUpperCase() + type.slice(1) + " Totem"}
      style={{
        width: '30px',
        height: '30px',
        display: 'inline-block',
        margin: '0 2px',
        cursor: 'pointer'
      }}
    >
      <img 
        src={totemImages[type]} 
        alt={`${type} totem`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: isActive ? 'none' : 'blur(0.5px) brightness(0.4) saturate(0.7)',
          transition: 'filter 0.1s'
        }}
      />
    </div>
  );
}
{/* Main Dashboard */}
export default function LandDashboard() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState(true);
   const darkSelectStyles = {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '4px',
    padding: '5px'
  };

  // State management
  const [playerName, setPlayerName] = useState("");
  const [cardsDetails, setCardsDetails] = useState([]);
  const [deeds, setDeeds] = useState([]);
  const [deedsWithAssets, setDeedsWithAssets] = useState([]);
  const [filteredDeeds, setFilteredDeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredEmblemDeedId, setHoveredEmblemDeedId] = useState(null);
  const [hoveredWorksiteDeedId, setHoveredWorksiteDeedId] = useState(null);
  const [hoveredFeatureDeedId, setHoveredFeatureDeedId] = useState(null);

  // Filter and sort states
  const [regionFilter, setRegionFilter] = useState("all");
  const [rarityFilters, setRarityFilters] = useState([]);
  const [worksiteFilter, setWorksiteFilter] = useState("all");
  const [geographyFilters, setGeographyFilters] = useState([]);
  const [biomeFilters, setBiomeFilters] = useState(["red", "blue", "white", "black", "green", "gold"]);
  const [ppFilter, setPpFilter] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [buildingInBoxFilter, setBuildingInBoxFilter] = useState(false);
  const [unstableTotemFilter, setUnstableTotemFilter] = useState(false);
  const [resourceFilters, setResourceFilters] = useState([]);
  const [totemFilters, setTotemFilters] = useState([]);

  // Available filter options
  const availableRegions = [...new Set(deedsWithAssets.map(deed => deed.region_name))].sort();
  const availableWorksites = [...new Set(deedsWithAssets.map(deed => deed.worksite_type).filter(Boolean))].sort();
  const geographyTypes = ["Badlands","Bog","Caldera","Canyon","Desert","Forest", "Hills","Jungle","Lake","Mountain","Plains","River", "Swamp","Tundra"];
  const rarityTypes = ["common", "rare", "epic", "legendary"];

  const sortOptions = [
    { value: "default", label: "Default Order" },
    { value: "pp-high", label: "Production (High to Low)" },
    { value: "pp-low", label: "Production (Low to High)" },
    { value: "highest-slot", label: "Highest Production Slot" },
    { value: "lowest-slot", label: "Lowest Production Slot" },
    { value: "dec-high", label: "DEC Required (High to Low)" },
    { value: "dec-low", label: "DEC Required (Low to High)" }  
  ];
  const biomeTypes = [
    { value: "red", label: "Fire", icon: "fire" },
    { value: "blue", label: "Water", icon: "water" },
    { value: "white", label: "Life", icon: "life" },
    { value: "black", label: "Death", icon: "death" },
    { value: "green", label: "Earth", icon: "earth" },
    { value: "gold", label: "Dragon", icon: "dragon" }
  ];

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  /* ==================== DATA FETCHING FUNCTIONS ==================== */

  const fetchData = async () => {
    if (!playerName.trim()) {
      setError("Please enter a player name");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiCache = {
        cards: null,
        deeds: null,
        assets: {}
      };

      const fetchWithRetry = async (url, options = {}, retries = 3) => {
        try {
          const response = await fetch(url, options);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
            return fetchWithRetry(url, options, retries - 1);
          }
          throw error;
        }
      };

      // Fetch cards details (only once as they don't change per player)
      if (!apiCache.cards) {
        apiCache.cards = await fetchWithRetry("https://api.splinterlands.com/cards/get_details");
        setCardsDetails(apiCache.cards);
      }

      // Fetch player-specific deeds data
      const deedsResponse = await fetchWithRetry(
        `https://vapi.splinterlands.com/land/deeds?status=collection&player=${playerName.toLowerCase()}`
      );
      apiCache.deeds = deedsResponse.data.deeds;
      
      // Get staking details and create a mapping by deed_uid
      const stakingDetails = deedsResponse.data.staking_details || [];
      apiCache.stakingMap = stakingDetails.reduce((map, detail) => {
        map[detail.deed_uid] = detail;
        return map;
      }, {});
      
      setDeeds(apiCache.deeds);

      const deedsWithAssetsData = await Promise.all(
        apiCache.deeds.map(async (deed) => {
          try {
            if (!apiCache.assets[deed.deed_uid]) {
              const assetsResponse = await fetchWithRetry(
                `https://vapi.splinterlands.com/land/stake/deeds/${deed.deed_uid}/assets`
              );
              apiCache.assets[deed.deed_uid] = assetsResponse.data;
            }

            const assets = apiCache.assets[deed.deed_uid];
            const staking_details = apiCache.stakingMap[deed.deed_uid] || {};
            
            const totalPP = assets.cards?.reduce(
              (sum, card) => sum + (parseFloat(card.total_harvest_pp) || 0), 
              0
            ) || 0;
            const resourcePerHour = assets.cards?.reduce(
              (sum, card) => sum + (parseFloat(card.work_per_hour) || 0),
              0
            ) || 0;
			const DecRequired = assets.cards?.reduce(
              (sum, card) => sum + (parseInt(card.dec_stake_needed) || 0),
              0
            ) || 0;
			console.log('DEC:', DecRequired);
			

            return { 
              ...deed, 
              assets, 
              staking_details,
              total_harvest_pp_sum: totalPP,
              resource_per_hour: resourcePerHour,
			  total_dec_required: DecRequired,
              loading: false,
              error: null
            };
          } catch (err) {
            return { 
              ...deed, 
              assets: { cards: [], items: [] }, 
              staking_details: {},
              total_harvest_pp_sum: 0,
              resource_per_hour: 0,
			  total_dec_required: 0,
              loading: false,
              error: err.message 
            };
          }
        })
      );
      
      setDeedsWithAssets(deedsWithAssetsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };


  /* ==================== HELPER FUNCTIONS ==================== */
/**
 * Gets the correct card image URL considering special cases
 * @param {number} card_detail_id - The card's detail ID
 * @param {string} card_set - The card set (alpha/beta/etc)
 * @param {string} cardName - The card's name
 * @returns {string} Correct image URL
 */
const getCardImageUrl = (card_detail_id, card_set, cardName) => {
  let imageType = "png"; // Use 'let' to allow reassignment

  // Special cases where we always use beta images
  const betaOverrideIds = [283, 281, 282, 288, 331, 332, 333, 334, 335, 336, 337, 338, 340, 341, 343, 344, 345, 346, 347, 349, 350, 451, 452, 454, 455, 456];

  // Special cases where we need jpg
  const imagetypeOverrideIds = [331, 332, 333, 334, 335, 336, 337, 338, 340, 341, 343, 344, 345, 346, 347, 349, 350, 367, 373, 374, 370, 383, 386, 387, 388, 389, 401, 409, 410, 411, 413, 415, 416, 425, 426, 427, 447, 451, 452, 454, 455, 456, 466, 500];

  // Riftwatchers specific override
  const riftOverrideIds = [466, 480, 500];

  // Normalize set
  let effectiveSet = card_set?.toLowerCase() || 'beta';

  // Step 1: Override alpha to beta
  if (effectiveSet === 'alpha') {
    effectiveSet = 'beta';
  }

  // Step 2: Override to riftwatchers for specific card_detail_ids
  if (riftOverrideIds.includes(card_detail_id)) {
    effectiveSet = 'riftwatchers';
  }
  // Step 3: Override to beta for specific card_detail_ids (only if not already set to riftwatchers)
  else if (betaOverrideIds.includes(card_detail_id)) {
    effectiveSet = 'beta';
  }

  // Step 4: Override to jpg for specific card_detail_ids
  if (imagetypeOverrideIds.includes(card_detail_id)) {
    imageType = 'jpg';
  }

  // Construct image URL
  return `https://d36mxiodymuqjm.cloudfront.net/cards_${effectiveSet}/${cardName}.${imageType}`;
};


  /**
   * Gets worksite image URL based on type
   * @param {string} type - Worksite type (e.g., "Logging Camp")
   * @returns {string} Image URL
   */
  const getWorksiteImage = (type) => {
    const worksiteMap = {
      "Logging Camp": "wood",
      "Quarry": "stone",
      "Grain Farm": "grain",
      "Research Hut": "research",
      "Aura Lab": "aura",
      "Ore Mine": "iron"
    };
    return worksiteMap[type] 
      ? `https://d36mxiodymuqjm.cloudfront.net/website/land/worksite/select/img_worksite-select_${worksiteMap[type]}.jpg`
      : null;
  };

  /**
   * Gets totem image URL based on name
   * @param {string} name - Totem name (e.g., "Legendary Totem")
   * @returns {string} Image URL
   */
  const getTotemImage = (name) => {
    const totemMap = {
      "Legendary Totem": "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_4_legendary_300.png",
      "Epic Totem": "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_3_epic_300.png",
      "Rare Totem": "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_2_rare_300.png",
      "Common Totem": "https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_totem_1_common_300.png"
    };
    return totemMap[name] || null;
  };

  /**
   * Gets color based on rarity
   * @param {string} rarity - Rarity level (1-4)
   * @returns {string} Hex color code
   */
  const getRarityColor = (rarity) => {
    const rarityColors = {
      "1": "#A0A0A0",  // Gray
      "2": "#4169E1",  // Blue
      "3": "#9370DB",  // Purple
      "4": "#FFD700"   // Gold
    };
    return rarityColors[rarity] || "#A0A0A0";
  };

  /**
   * Gets resource icon URL based on worksite type
   * @param {string} type - Worksite type
   * @returns {string} Image URL
   */
  const getResourceIcon = (type) => {
    const resourceMap = {
      "Logging Camp": "wood",
      "Quarry": "stone",
      "Grain Farm": "grain",
      "Research Hut": "research",
      "Aura Lab": "aura",
      "Ore Mine": "iron"
    };
    
    const resource = resourceMap[type];
    
    if (type === "Grain Farm") {
      return "https://d36mxiodymuqjm.cloudfront.net/website/land/productionOverview/icon_grain.png";
    }
    
    if (type === "Research Hut") {
      return "https://d36mxiodymuqjm.cloudfront.net/website/land/productionOverview/icon_research.png";
    }
    
    return resource 
      ? `https://d36mxiodymuqjm.cloudfront.net/website/land/resources/${resource}_200.webp`
      : null;
  };

  /**
   * Generates land management URL
   * @param {string} region_id - Region ID
   * @param {string} plot_id - Plot ID
   * @returns {string} Full management URL
   */
  const getLandManagementUrl = (region_id, plot_id) => {
    return `https://splinterlands.com/land/overview/praetoria/${region_id}/${plot_id}`;
  };

  /**
   * Calculates max BCX for a card
   * @param {number} card_detail_id - Card detail ID
   * @param {boolean} gold - Whether card is gold foil
   * @param {string} card_set - Card set (alpha/beta/etc)
   * @param {array} cardsDetails - Cards details array
   * @returns {number} Max BCX value
   */
  const getMaxBCX = (card_detail_id, gold, card_set, cardsDetails) => {
    const cardDetail = cardsDetails.find(card => card.id === card_detail_id);
    if (!cardDetail) return 10;
    
    const rarity = cardDetail.rarity;
    const cardSet = card_set?.toLowerCase();
    
    if (!gold) {
      if (cardSet === 'alpha') {
        switch(rarity) {
          case 1: return 379;
          case 2: return 86;
          case 3: return 32;
          case 4: return 8;
          default: return 10;
        }
      } else if (cardSet === 'beta') {
        switch(rarity) {
          case 1: return 505;
          case 2: return 115;
          case 3: return 46;
          case 4: return 11;
          default: return 10;
        }
      } else {
        switch(rarity) {
          case 1: return 400;
          case 2: return 115;
          case 3: return 46;
          case 4: return 11;
          default: return 10;
        }
      }
    } else {
      if (cardSet === 'alpha') {
        switch(rarity) {
          case 1: return 31;
          case 2: return 17;
          case 3: return 8;
          case 4: return 3;
          default: return 10;
        }
      } else {
        switch(rarity) {
          case 1: return 38;
          case 2: return 22;
          case 3: return 10;
          case 4: return 4;
          default: return 10;
        }
      }
    }
  };

  /* ==================== SORTING FUNCTIONS ==================== */

  /**
   * Gets the weakest card PP on a plot
   * @param {object} deed - The deed object with assets
   * @returns {number} The PP of the weakest card
   */
  const getWeakestCardPP = (deed) => {
    if (!deed.assets?.cards?.length) return 0;
    return Math.min(...deed.assets.cards.map(card => parseFloat(card.total_harvest_pp) || 0));
  };

  /**
   * Gets the strongest card PP on a plot
   * @param {object} deed - The deed object with assets
   * @returns {number} The PP of the strongest card
   */
  const getStrongestCardPP = (deed) => {
    if (!deed.assets?.cards?.length) return 0;
    return Math.max(...deed.assets.cards.map(card => parseFloat(card.total_harvest_pp) || 0));
  };

  /**
 * Applies all filters and sorting to the deeds data
 */
const applyFiltersAndSorting = () => {
  let result = [...deedsWithAssets];

  // Apply region filter
  if (regionFilter !== "all") {
    result = result.filter(deed => deed.region_name === regionFilter);
  }

  // Apply rarity filters
  if (rarityFilters.length > 0) {
    result = result.filter(deed => rarityFilters.includes(deed.rarity));
  }
  
  // Apply resource filters
  if (resourceFilters.length > 0) {
    result = result.filter(deed => {
      try {
        const landStats = JSON.parse(deed.land_stats || '{}');
        const resources = landStats.resources || [];
        return resourceFilters.some(resource => resources.includes(resource));
      } catch {
        return false;
      }
    });
  }

  // Apply worksite filter
  if (worksiteFilter !== "all") {
    result = result.filter(deed => deed.worksite_type === worksiteFilter);
  }

  // Apply geography filters
  if (geographyFilters.length > 0) {
    result = result.filter(deed => geographyFilters.includes(deed.deed_type));
  }

  // Apply PP filter
  if (ppFilter !== "all") {
    const ppThreshold = parseInt(ppFilter);
    result = result.filter(deed => {
      const weakestPP = getWeakestCardPP(deed);
      return weakestPP < ppThreshold;
    });
  }
   // Apply totem filter
  if (totemFilters.length > 0) {
    result = result.filter(deed => {
      const totemItem = deed.assets.items?.find(item => item.stake_type_uid === "STK-LND-TOT");
      if (!totemItem) return false;
      
      const totemType = totemItem.name.toLowerCase().replace(' totem', '');
      return totemFilters.includes(totemType);
    });
  }
  
// Apply Building in a Box filter
  if (buildingInBoxFilter) {
    result = result.filter(deed => {
      try {
        const stats = JSON.parse(deed.stats || '{}');
        return stats.building_in_box === true;
      } catch {
        return false;
      }
    });
  }

  // Apply Unstable Totem filter
  if (unstableTotemFilter) {
    result = result.filter(deed => {
      try {
        const stats = JSON.parse(deed.stats || '{}');
        return stats.unstable_totem === true;
      } catch {
        return false;
      }
    });
  }

  // Apply biome filters - Optimized version
  if (biomeFilters.length > 0) {
    result = result.filter(deed => {
      const staking = deed.staking_details || {};
      return biomeFilters.some(biome => {
        const modifier = staking[`${biome}_biome_modifier`];
        return modifier > 0; // Only include if modifier is positive
      });
    });
  }

  // Apply sorting
  switch(sortOption) {
    case "pp-high":
      result.sort((a, b) => b.total_harvest_pp_sum - a.total_harvest_pp_sum);
      break;
    case "pp-low":
      result.sort((a, b) => a.total_harvest_pp_sum - b.total_harvest_pp_sum);
      break;
    case "highest-slot":
      result.sort((a, b) => getStrongestCardPP(b) - getStrongestCardPP(a));
      break;
    case "lowest-slot":
      result.sort((a, b) => getWeakestCardPP(a) - getWeakestCardPP(b));
      break;
    case "dec-high":  // New case
      result.sort((a, b) => b.total_dec_required - a.total_dec_required);
      break;
    case "dec-low":   // New case
      result.sort((a, b) => a.total_dec_required - b.total_dec_required);
      break;
  }

  setFilteredDeeds(result);
};

// Apply filters whenever relevant state changes
useEffect(() => {
  if (deedsWithAssets.length > 0) {
    applyFiltersAndSorting();
  }
}, [deedsWithAssets, regionFilter, rarityFilters, worksiteFilter, geographyFilters, ppFilter, sortOption, biomeFilters, buildingInBoxFilter, unstableTotemFilter, resourceFilters, totemFilters]); // Added biomeFilters to dependencies

  /* ==================== COMPONENTS FOR DRAWING DEED TILES ==================== */

  /**
   * Worker Tile Component - Displays worker card information
   */
const WorkerTile = ({ card, cardDetail, cardsDetails }) => {
  const cardName = cardDetail?.name || card.name.split(' - ')[0];
  const imageUrl = getCardImageUrl(card.card_detail_id, card.card_set, cardName);
  const rarityColor = getRarityColor(cardDetail?.rarity || "Common");
  const maxBcx = getMaxBCX(card.card_detail_id, card.gold, card.card_set, cardsDetails);

  return (
    <div className="worker-container">
	{/* Add DEC stake requirement display here */}
      <div className="dec-stake-requirement">
      {parseFloat(card.dec_stake_needed).toLocaleString('en-US', {
    maximumFractionDigits: 0 })} DEC
      </div>
      <div className="worker-tile" style={{ borderColor: card.is_powered ? '#4CAF50' : '#f44336' }}>
        <img
          src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/worksite/slot_frame_equipment.svg"
          alt="Slot frame"
          className="slot-frame"
        />
        <img src={imageUrl} alt={cardName} className="worker-image" />
        <div className="rarity-badge" style={{ backgroundColor: rarityColor }} />
        <div className="bcx-badge">
          {card.bcx}/{maxBcx}
        </div>
        {/* Add card name display here */}
        <div className="card-name">
          {cardName}
        </div>
      </div>
      <div className="worker-info">
        <div className="pp-base">
          <span className="pp-label">B:  </span>
          <span className="pp-values">
            {(Math.round(parseFloat(card.base_pp_after_cap) * 10) / 10).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })}
          </span>
        </div>
        <div className="pp-boosted">
          <span className="pp-boosted">B+:  </span>
          <span className="pp-values">
            {(Math.round(parseFloat(card.total_harvest_pp) * 10) / 10).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })}
          </span>
        </div>
        <div className="card-uid">{card.uid}</div>
      </div>
    </div>
  );
};

  /**
   * Boost Tile Component - Displays totems and titles
   */
  const BoostTile = ({ imageUrl, name, boost, borderColor }) => {
    const boostPercent = boost ? `${(parseFloat(boost) * 100).toFixed(0)}%` : null;

    return (
      <div className="boost-tile" style={{ borderColor }}>
        <img
          src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/worksite/slot_frame_equipment.svg"
          alt="Slot frame"
          className="slot-frame"
        />
        <img src={imageUrl} alt={name} className="boost-image" />
        {boostPercent && (
          <div className="boost-percent">
            {boostPercent}
          </div>
        )}
        <div className="boost-name">
          {name}
        </div>
      </div>
    );
  };

  /**
   * Slot Tiles Container - Organizes workers, totems, and titles
   */
  const SlotTiles = ({ cards, cardsDetails, totemItem, titleItem }) => {
    return (
      <div className="slot-tiles-container">
        {cards?.map(card => {
          const cardDetail = cardsDetails?.find(c => c.id === card.card_detail_id);
          return (
            <WorkerTile 
              key={`worker-${card.uid}`} 
              card={card} 
              cardDetail={cardDetail} 
              cardsDetails={cardsDetails} 
            />
          );
        })}
        {totemItem && (
          <BoostTile
            key={`totem-${totemItem.uid}`}
            imageUrl={getTotemImage(totemItem.name)}
            name={totemItem.name}
            boost={totemItem.boost}
            borderColor="#FFD700"
          />
        )}
        {titleItem && (
          <BoostTile
            key={`title-${titleItem.uid}`}
            imageUrl={`https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_title_${
              titleItem.name.toLowerCase().replace(/\bthe\b/g, "").replace(/\s+/g, "")
            }.svg`}
            name={titleItem.name}
            boost={titleItem.boost}
            borderColor="#90EE90"
          />
        )}
      </div>
    );
  };

  /* ==================== FILTER HANDLERS ==================== */

/* Plot Rarity Filter Handler */
  const handleRarityFilterChange = (rarity) => {
    setRarityFilters(prev => 
      prev.includes(rarity) 
        ? prev.filter(r => r !== rarity) 
        : [...prev, rarity]
    );
  };
/* Geography Filter Handler */
  const handleGeographyFilterChange = (geography) => {
    setGeographyFilters(prev => 
      prev.includes(geography) 
        ? prev.filter(g => g !== geography) 
        : [...prev, geography]
    );
  };
  /* Biome Filter Handler */
  const handleBiomeFilterChange = (biome) => {
  setBiomeFilters(prev => 
    prev.includes(biome) 
      ? prev.filter(b => b !== biome) 
      : [...prev, biome]
  );
};
/* Resource Filter Handler */
const handleResourceFilterChange = (resource) => {
  setResourceFilters(prev => 
    prev.includes(resource) 
      ? prev.filter(r => r !== resource) 
      : [...prev, resource]
  );
};
 /* Totem Filter handler */
  const handleTotemFilterChange = (totemType) => {
    setTotemFilters(prev => 
      prev.includes(totemType) 
        ? prev.filter(t => t !== totemType) 
        : [...prev, totemType]
    );
  };

  /* ==================== RENDER COMPONENTS ==================== */

 if (loading) return (
  <div className={`loading-screen ${darkMode ? 'dark-mode' : ''}`} style={{
    backgroundColor: darkMode ? '#121212' : 'white',
    color: darkMode ? '#e0e0e0' : '#333',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000
  }}>
    <div className="spinner" style={{
      width: '50px',
      height: '50px',
      border: '5px solid transparent',
      borderTopColor: darkMode ? '#4CAF50' : '#09f',
      borderLeftColor: darkMode ? '#4CAF50' : '#09f',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }} />
    <div>Loading land data...</div>
  </div>
);

  return (
	<div className={`land-dashboard ${darkMode ? 'dark-mode' : ''}`}>
	{/*Dark mode toggle button */}
    <div className="dark-mode-toggle" onClick={toggleDarkMode}>
      {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </div>
  {/* Add this player input section */}
  <div className="player-input-section">
    <div className="player-input-group">
      <input
        type="text"
        className="player-input"
        placeholder="Enter player name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && fetchData()}
      />
      <button 
        className="fetch-button"
        onClick={fetchData}
        disabled={loading || !playerName.trim()}
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
    </div>
  </div>
      <h1>Land Deeds Dashboard for {playerName}</h1>
      
      {/* Filter Controls */}
      <div className={`filter-controls ${darkMode ? 'dark-mode' : ''}`}>
        
		  {/* Region Filter */}
  <div className="filter-group">
    <label htmlFor="region-filter">Region:</label>
    <select 
     id="region-filter" 
     value={regionFilter}
     onChange={(e) => setRegionFilter(e.target.value)}
     style={darkMode ? darkSelectStyles : {}}
     >
      <option value="all">All Regions</option>
      {availableRegions.map(region => (
        <option key={region} value={region}>{region}</option>
      ))}
    </select>
  </div>

{/* Plot Rarity Filter - Updated to use image icons */}
<div className="plot-info">
  {/* Plot Rarity Group */}
  <div className="plot-rarity-group">
    <label>Plot Rarity:</label>
    <div className="rarity-filter-group">
      {/* Common */}
      <div 
        className={`rarity-filter ${rarityFilters.includes("common") ? 'active' : ''}`}
        onClick={() => handleRarityFilterChange("common")}
        title="Common"
      >
        <img 
          src={rarityFilters.includes("common") 
            ? "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/commonOn.svg" 
            : "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/commonOff.svg"}
          alt="Common"
        />
      </div>
      
      {/* Rare */}
      <div 
        className={`rarity-filter ${rarityFilters.includes("rare") ? 'active' : ''}`}
        onClick={() => handleRarityFilterChange("rare")}
        title="Rare"
      >
        <img 
          src={rarityFilters.includes("rare") 
            ? "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/rareOn.svg" 
            : "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/rareOff.svg"}
          alt="Rare"
        />
      </div>
      
      {/* Epic */}
      <div 
        className={`rarity-filter ${rarityFilters.includes("epic") ? 'active' : ''}`}
        onClick={() => handleRarityFilterChange("epic")}
        title="Epic"
      >
        <img 
          src={rarityFilters.includes("epic") 
            ? "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/epicOn.svg" 
            : "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/epicOff.svg"}
          alt="Epic"
        />
      </div>
      
      {/* Legendary */}
      <div 
        className={`rarity-filter ${rarityFilters.includes("legendary") ? 'active' : ''}`}
        onClick={() => handleRarityFilterChange("legendary")}
        title="Legendary"
      >
        <img 
          src={rarityFilters.includes("legendary") 
            ? "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/legendaryOn.svg" 
            : "https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/sideMenu/legendaryOff.svg"}
          alt="Legendary"
        />
      </div>
    </div>
  </div>

  {/* Natural Resources Group */}
  <div className="filter-group natural-resources-group">
    <label>Natural Resources:</label>
    <div className="resource-checkbox-grid">
      {/* First row */}
      <div className="checkbox-row">
        <label className="checkbox-label" title="Grain">
          <input
            type="checkbox"
            checked={resourceFilters.includes("grain")}
            onChange={() => handleResourceFilterChange("grain")}
          />
          <img 
            src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/resources/grain.png" 
            alt="Grain" 
            className="resource-checkbox-icon"
          />
        </label>
        <label className="checkbox-label" title="Ore">
          <input
            type="checkbox"
            checked={resourceFilters.includes("ore")}
            onChange={() => handleResourceFilterChange("ore")}
          />
          <img 
            src="https://d36mxiodymuqjm.cloudfront.net/website/land/resources/iron_200.webp" 
            alt="Ore" 
            className="resource-checkbox-icon"
          />
        </label>
      </div>
      
      {/* Second row */}
      <div className="checkbox-row">
        <label className="checkbox-label" title="Stone">
          <input
            type="checkbox"
            checked={resourceFilters.includes("stone")}
            onChange={() => handleResourceFilterChange("stone")}
          />
          <img 
            src="https://d36mxiodymuqjm.cloudfront.net/website/land/resources/stone_200.webp" 
            alt="Stone" 
            className="resource-checkbox-icon"
          />
        </label>
        <label className="checkbox-label" title="Wood">
          <input
            type="checkbox"
            checked={resourceFilters.includes("wood")}
            onChange={() => handleResourceFilterChange("wood")}
          />
          <img 
            src="https://d36mxiodymuqjm.cloudfront.net/website/land/resources/wood_200.webp" 
            alt="Wood" 
            className="resource-checkbox-icon"
          />
        </label>
      </div>
    </div>
  </div>
  {/* Totem Filters */}
		<div className="filter-group">
  <label>Totem Filter:</label>
  <div className="totem-filter-group">
    <TotemIcon 
      type="common" 
      isActive={totemFilters.includes("common")} 
      onClick={() => handleTotemFilterChange("common")} 
    />
    <TotemIcon 
      type="rare" 
      isActive={totemFilters.includes("rare")} 
      onClick={() => handleTotemFilterChange("rare")} 
    />
    <TotemIcon 
      type="epic" 
      isActive={totemFilters.includes("epic")} 
      onClick={() => handleTotemFilterChange("epic")} 
    />
    <TotemIcon 
      type="legendary" 
      isActive={totemFilters.includes("legendary")} 
      onClick={() => handleTotemFilterChange("legendary")} 
    />
    <button 
      className="clear-totem-filter"
      onClick={() => setTotemFilters([])}
      style={{
        marginLeft: '10px',
        padding: '2px 6px',
        background: '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Clear
    </button>
  </div>
</div>
		
  {/* Starter Package Filters */}
<div className="starter-checkbox-group">
  <label>Starter Package: </label>
  <div className="starter-checkbox-row">
    <label className="starter-checkbox-label" title="Building in a Box">
      <input
        type="checkbox"
        checked={buildingInBoxFilter}
        onChange={() => setBuildingInBoxFilter(!buildingInBoxFilter)}
      />
      <img 
        src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/deedAssets/Icon_hut@2x.png" 
        alt="Building in a Box" 
        style={{ width: '24px', height: '24px' }}
      />
    </label>
    <label className="starter-checkbox-label" title="Unstable Totem">
      <input
        type="checkbox"
        checked={unstableTotemFilter}
        onChange={() => setUnstableTotemFilter(!unstableTotemFilter)}
      />
      <img 
        src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/deedAssets/Icon_totem@2x.png" 
        alt="Unstable Totem" 
        style={{ width: '24px', height: '24px' }}
      />
    </label>
  </div>
</div>
</div>
{/*Custom Sorts */}
<div className="custom-sort-group">
        {/* Worksite Filter */}
        <div className="worksite-filter-group">
    <label htmlFor="worksite-filter">Worksite:</label>
    <select 
      id="worksite-filter" 
      value={worksiteFilter}
      onChange={(e) => setWorksiteFilter(e.target.value)}
      style={darkMode ? darkSelectStyles : {}}
    >
      <option value="all">All Worksites</option>
      {availableWorksites.map(worksite => (
        <option key={worksite} value={worksite}>{worksite}</option>
      ))}
    </select>
  </div>
          {/* PP Filter */}
<div className="pp-filter-group">
  <label htmlFor="pp-filter">Weakest Slot PP:</label>
  <select 
    id="pp-filter" 
    value={ppFilter}
    onChange={(e) => setPpFilter(e.target.value)}
    style={darkMode ? darkSelectStyles : {}}
  >
    {[
      { value: "all", label: "All PP" },
      { value: "500", label: "<500 PP" },
      { value: "1000", label: "<1000 PP" },
      { value: "1500", label: "<1500 PP" },
      { value: "2000", label: "<2000 PP" },
      { value: "3000", label: "<3000 PP" },
      { value: "5000", label: "<5000 PP" },
      { value: "6250", label: "<6250 PP" },
      { value: "7250", label: "<7250 PP" }
    ].map(range => (
      <option key={range.value} value={range.value}>{range.label}</option>
    ))}
  </select>
</div>
    {/* Sort Options */}
        <div className="filter-group">
    <label htmlFor="sort-option">Sort By:</label>
    <select 
      id="sort-option" 
      value={sortOption}
      onChange={(e) => setSortOption(e.target.value)}
      style={darkMode ? darkSelectStyles : {}}
    >
      {sortOptions.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
        </div>
</div>
 {/* Geography Terrain Filter */}
<div className="geography-resource-filter-section">
  <label>Geography  & Resources</label>
  
  {/* Row 1: Badlands, Caldera, Mountain + Iron */}
  <div className="geography-row">
    <div className="geography-icons-group">
      {['Badlands', 'Caldera', 'Mountain'].map(geography => (
        <GeographyIcon 
          key={geography}
          geography={geography}
          isActive={geographyFilters.includes(geography)}
          onClick={() => handleGeographyFilterChange(geography)}
        />
      ))}
    </div>
    <div className="resource-icon-group">
      <img 
        src="https://d36mxiodymuqjm.cloudfront.net/website/land/resources/iron_200.webp" 
        alt="Iron" 
        className="resource-icon"
        title="Iron"
		style={{ width: '30px', height: '30px', verticalAlign: 'middle' }}
      />
    </div>
  </div>

  {/* Row 2: Canyon, Desert, Hills + Stone */}
  <div className="geography-row">
    <div className="geography-icons-group">
      {['Canyon', 'Desert', 'Hills'].map(geography => (
        <GeographyIcon 
          key={geography}
          geography={geography}
          isActive={geographyFilters.includes(geography)}
          onClick={() => handleGeographyFilterChange(geography)}
        />
      ))}
    </div>
    <div className="resource-icon-group">
      <img 
        src="https://d36mxiodymuqjm.cloudfront.net/website/land/resources/stone_200.webp" 
        alt="Stone" 
        className="resource-icon"
        title="Stone"
		style={{ width: '30px', height: '30px', verticalAlign: 'middle' }}
      />
    </div>
  </div>

  {/* Row 3: Forest, Jungle, Swamp, Tundra + Wood */}
  <div className="geography-row">
    <div className="geography-icons-group">
      {['Forest', 'Jungle', 'Swamp', 'Tundra'].map(geography => (
        <GeographyIcon 
          key={geography}
          geography={geography}
          isActive={geographyFilters.includes(geography)}
          onClick={() => handleGeographyFilterChange(geography)}
        />
      ))}
    </div>
    <div className="resource-icon-group">
      <img 
        src="https://d36mxiodymuqjm.cloudfront.net/website/land/resources/wood_200.webp" 
        alt="Wood" 
        className="resource-icon"
        title="Wood"
		style={{ width: '30px', height: '30px', verticalAlign: 'middle' }}
      />
    </div>
  </div>

  {/* Row 4: Bog, Lake, Plains, River + Grain */}
  <div className="geography-row">
    <div className="geography-icons-group">
      {['Bog', 'Lake', 'Plains', 'River'].map(geography => (
        <GeographyIcon 
          key={geography}
          geography={geography}
          isActive={geographyFilters.includes(geography)}
          onClick={() => handleGeographyFilterChange(geography)}
        />
      ))}
    </div>
    <div className="resource-icon-group">
      <img 
        src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/resources/grain.png" 
        alt="Grain" 
        className="resource-icon"
        title="Grain"
		style={{ width: '30px', height: '30px', verticalAlign: 'middle' }}
      />
    </div>
  </div>
  
  
        {/* Terrain Synergy Filter*/}
        <div className="terrain-synergies-filter-group">
          <label>Terrain Synergies:</label>
          <div className="biome-filter-group">
            {biomeTypes.map(biome => (
              <div 
                key={biome.value}
                className={`biome-filter ${biomeFilters.includes(biome.value) ? 'active' : ''}`}
                onClick={() => handleBiomeFilterChange(biome.value)}
                title={biome.label}
              >
                <img 
                  src={`https://d36mxiodymuqjm.cloudfront.net/website/collection/icon_element_${biome.icon}${biomeFilters.includes(biome.value) ? '' : '_inactive'}.svg`}
                  alt={biome.label}
				  style={{ width: '30px', height: '30px', verticalAlign: 'middle' }}
                />
              </div>
            ))}
          </div>
        </div>
</div>




     
		{/* Clear Filters Button */}
<div className="filter-group">
  <button 
    className="clear-filters-btn"
    onClick={() => {
      setRegionFilter("all");
      setRarityFilters([]);
      setWorksiteFilter("all");
      setGeographyFilters([]);
      setPpFilter("all");
      setBiomeFilters([]);
      setSortOption("default");
    }}
  >
    Clear All Filters
  </button>
</div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing {filteredDeeds.length} of {deedsWithAssets.length} deeds
      </div>
      
      <div className="deeds-container">
        {filteredDeeds.map((deed) => {
          const deedTypeLower = deed.deed_type.toLowerCase();
          const deedStatusLower = deed.plot_status.toLowerCase();
          const deedRarityLower = deed.rarity.toLowerCase();
          const deedMagicLower = deed.magic_type?.toLowerCase() || "";
          const deedWorksiteLower = deed.worksite_type?.toLowerCase().replace(/\s+/g, "") || "";
          
          let bgImageUrl;
          if (deedStatusLower === "kingdom") {
            bgImageUrl = `https://d36mxiodymuqjm.cloudfront.net/website/land/deedsSurveyed/${deedTypeLower}_${deedStatusLower}_${deedWorksiteLower}.jpg`;
          } else if (deedStatusLower === "magical") {
            bgImageUrl = `https://d36mxiodymuqjm.cloudfront.net/website/land/deedsSurveyed/${deedTypeLower}_${deedStatusLower}_${deedMagicLower}_${deedRarityLower}.jpg`;
          } else {
            bgImageUrl = `https://d36mxiodymuqjm.cloudfront.net/website/land/deedsSurveyed/${deedTypeLower}_${deedStatusLower}_${deedRarityLower}_build.jpg`;
          }

          return (
            <div key={deed.deed_uid} className="deed-tile" style={{ backgroundImage: `url(${bgImageUrl})` }}>
              {/* Worksite icon with independent hover */}
              {getWorksiteImage(deed.worksite_type) && (
                <div className="worksite-icon-container">
                  <img
                    src={getWorksiteImage(deed.worksite_type)}
                    alt={`${deed.worksite_type} Icon`}
                    className="worksite-icon"
                    onMouseEnter={() => setHoveredWorksiteDeedId(deed.deed_uid)}
                    onMouseLeave={() => setHoveredWorksiteDeedId(null)}
                  />
                  {hoveredWorksiteDeedId === deed.deed_uid && (
                    <div className="worksite-tooltip">{deed.worksite_type}</div>
                  )}
                </div>
              )}
			  {/* BIB icons with hover */}
			  {(() => {
  try {
    const stats = JSON.parse(deed.stats || '{}');
    return (
	
      <div className="special-features">
        {stats.building_in_box && (
          <div className="feature-icon-container-BIB">
            <img
              src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/deedAssets/Icon_hut@2x.png"
              alt="Building in a Box"
              className="feature-icon"
              onMouseEnter={() => setHoveredFeatureDeedId([deed.deed_uid, 'building'])}
              onMouseLeave={() => setHoveredFeatureDeedId(null)}
            />
            {hoveredFeatureDeedId?.[0] === deed.deed_uid && hoveredFeatureDeedId?.[1] === 'building' && (
              <div className="feature-tooltip">Building in a Box</div>
            )}
          </div>
        )}
		{/* UT icons with hover */}
        {stats.unstable_totem && (
          <div className="feature-icon-container-UT">
            <img
              src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/lands/deedAssets/Icon_totem@2x.png"
              alt="Unstable Totem"
              className="feature-icon"
              onMouseEnter={() => setHoveredFeatureDeedId([deed.deed_uid, 'totem'])}
              onMouseLeave={() => setHoveredFeatureDeedId(null)}
            />
            {hoveredFeatureDeedId?.[0] === deed.deed_uid && hoveredFeatureDeedId?.[1] === 'totem' && (
              <div className="feature-tooltip">Unstable Totem</div>
            )}
          </div>
        )}
      </div>
    );
  } catch {
    return null;
  }
})()}

              {/* Deed emblem with its own hover */}
              <div className="emblem-container">
                <img
                  src={`https://next.splinterlands.com/assets/lands/deedAssets/img_geography-emblem_${deedTypeLower}.svg`}
                  alt={`${deed.deed_type} emblem`}
                  className="emblem-icon"
                  onMouseEnter={() => setHoveredEmblemDeedId(deed.deed_uid)}
                  onMouseLeave={() => setHoveredEmblemDeedId(null)}
                />
                {hoveredEmblemDeedId === deed.deed_uid && (
                  <div className="emblem-tooltip">{deed.deed_type}</div>
                )}
              </div>
 {/* ====== TERRAIN SYNERGIES DISPLAY HERE ====== */}
        {deed.staking_details && (
          <div className="terrain-synergies">
            <div className="synergy-label">Terrain Synergies</div>
            <div className="synergy-icons">
              {deed.staking_details.red_biome_modifier > 0 && (
                <img 
                  src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/icon_splinter_fire.svg" 
                  alt="Fire Synergy" 
                  title={`Fire +${(deed.staking_details.red_biome_modifier * 100).toFixed(0)}%`}
                />
              )}
              {deed.staking_details.blue_biome_modifier > 0 && (
                <img 
                  src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/icon_splinter_water.svg" 
                  alt="Water Synergy" 
                  title={`Water +${(deed.staking_details.blue_biome_modifier * 100).toFixed(0)}%`}
                />
              )}
              {deed.staking_details.white_biome_modifier > 0 && (
                <img 
                  src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/icon_splinter_life.svg" 
                  alt="Life Synergy" 
                  title={`Life +${(deed.staking_details.white_biome_modifier * 100).toFixed(0)}%`}
                />
              )}
              {deed.staking_details.black_biome_modifier > 0 && (
                <img 
                  src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/icon_splinter_death.svg" 
                  alt="Death Synergy" 
                  title={`Death +${(deed.staking_details.black_biome_modifier * 100).toFixed(0)}%`}
                />
              )}
              {deed.staking_details.green_biome_modifier > 0 && (
                <img 
                  src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/icon_splinter_earth.svg" 
                  alt="Earth Synergy" 
                  title={`Earth +${(deed.staking_details.green_biome_modifier * 100).toFixed(0)}%`}
                />
              )}
              {deed.staking_details.gold_biome_modifier > 0 && (
                <img 
                  src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/icon_splinter_dragon.svg" 
                  alt="Dragon Synergy" 
                  title={`Dragon +${(deed.staking_details.gold_biome_modifier * 100).toFixed(0)}%`}
                />
              )}
            </div>
          </div>
        )}


              <div className="territory-info">
                {`${deed.territory} | ${deed.region_name}`}
              </div>

              <div className="location-info">
                <div className="location-numbers">
                  <span>{deed.region_number}</span>
                  <img src="https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_claim_region_256.png" alt="Region" />
                  <span>{deed.tract_number}</span>
                  <img src="https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_claim_tract_256.png" alt="Tract" />
                  <span>{deed.plot_number}</span>
                  <img src="https://d36mxiodymuqjm.cloudfront.net/website/icons/icon_claim_plot_256.png" alt="Plot" />
                </div>
                <div className="production-summary">
                  <span>{(Math.round(parseFloat(deed.total_harvest_pp_sum?.toFixed(0) ?? 0) * 10) / 10).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    })}
				  </span>
                  <img src="https://next.splinterlands.com/assets/lands/deedOverview/hammer.svg" alt="Production" /> / Hour
                </div>
                {deed.worksite_type && (
                  <div className="resource-production">
                    <span>{deed.resource_per_hour?.toFixed(2) ?? 0}</span>
                    <img 
                      src={getResourceIcon(deed.worksite_type)} 
                      alt={deed.worksite_type} 
                      className="resource-icon"
                    />
                    <span className="per-hour-label">/ Hour</span>
                  </div>
                )}
              </div>
			  {deed.assets?.cards?.length > 0 && (
  <div className="required-plot-dec-total">
    
<span>
{parseFloat(deed.total_dec_required).toLocaleString('en-US', {
    maximumFractionDigits: 0 })} DEC
    </span>
    <img 
      src="https://d36mxiodymuqjm.cloudfront.net/website/ui_elements/buy_coins/Icon_DEC.svg" 
      alt="DEC" 
      className="dec-icon"
    />
    <span className="required-label">Required</span>
  </div>
)}

             {/* Land Management Button */}
<a 
  href={getLandManagementUrl(deed.region_id, deed.plot_id)}
  target="_blank"
  rel="noopener noreferrer"
  className="management-button"
>
  Manage Land
</a>

              <SlotTiles 
                cards={deed.assets.cards} 
                cardsDetails={cardsDetails}
                totemItem={deed.assets.items?.find(item => item.stake_type_uid === "STK-LND-TOT")}
                titleItem={deed.assets.items?.find(item => item.stake_type_uid === "STK-LND-TTL")}
              />
            </div>
          );
        })}
      </div>   
 
{/* CSS Components */}
<style jsx>{`
  /* ==================== BASE STYLES ==================== */
  body {
    margin: 0;
    padding: 0;
    transition: background-color 0.3s ease;
    background-color: ${darkMode ? '#121212' : '#ffffff'};
  }
  
  .land-dashboard {
    padding: 20px;
    min-height: 100vh;
    max-width: 2000px;
    margin: 0 auto;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
  }

  /* ==================== DARK MODE STYLES ==================== */
  .dark-mode {
    background-color: #121212;
    color: #e0e0e0;
  }
  
  .dark-mode h1 {
    color: #ffffff;
  }
  
  .dark-mode .player-input {
    background-color: #333;
    color: #fff;
    border-color: #555;
  }
  
  .dark-mode .filter-controls {
    background-color: #1e1e1e;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    color: #e0e0e0;
  }
  
  .dark-mode .filter-group label,
  .dark-mode .filter-controls > label {
    color: #e0e0e0 !important;
  }
  
  .dark-mode select {
    background-color: #333;
    color: white;
    border-color: #555;
  }

  .dark-mode select option {
    background-color: #333;
    color: white;
  }

  .dark-mode .checkbox-label {
    color: #e0e0e0;
  }

  .dark-mode .results-count {
    color: #aaa;
  }
  
  .dark-mode .error-screen {
    background-color: #2a1a1a;
    border-color: #5c2e2e;
  }

  /* Dark mode toggle button */
  .dark-mode-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background-color: ${darkMode ? '#333' : '#f0f0f0'};
    color: ${darkMode ? '#fff' : '#333'};
    border-radius: 20px;
    cursor: pointer;
    z-index: 1000;
    font-size: 14px;
    transition: all 0.3s;
    border: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  .dark-mode-toggle:hover {
    background-color: ${darkMode ? '#444' : '#e0e0e0'};
  }

  /* ==================== PLAYER INPUT SECTION ==================== */
  .player-input-section {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .player-input-group {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }
  
  .player-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 250px;
    font-size: 16px;
  }
  
  .fetch-button {
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }
  
  .fetch-button:hover {
    background: #45a049;
  }
  
  .fetch-button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  /* ==================== FILTER CONTROLS ==================== */
  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 150px;
  }
  
  .filter-group label {
    font-weight: bold;
    font-size: 14px;
    color: #333;
  }
  
  .filter-group select {
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background: white;
  }
  
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  .checkbox-label input {
    margin: 0;
  }

  /* ==================== PLOT RARITY FILTER ==================== */
  .plot-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .plot-rarity-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rarity-filter-group {
    display: flex;
    gap: 8px;
  }

  .rarity-filter {
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s;
    width: 24px;
    height: 24px;
  }

  .rarity-filter:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  .rarity-filter.active {
    opacity: 1;
    transform: scale(1.1);
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
  }

  /* ==================== NATURAL RESOURCES ==================== */
  .natural-resources-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-row {
    display: flex;
    gap: 12px;
  }

  .resource-checkbox-icon {
    width: 24px;
    height: 24px;
    vertical-align: middle;
    margin-left: 4px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .resource-checkbox-icon:hover {
    transform: scale(1.2);
  }
    /* ==================== STARTER PACKAGE FILTERS ==================== */
  .starter-checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .starter-checkbox-row {
    display: flex;
    gap: 12px;
  }

  .starter-checkbox-label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .starter-checkbox-label:hover {
    transform: scale(1.1);
  }

  .starter-checkbox-label input {
    margin: 0;
  }


  /* ==================== GEOGRAPHY FILTER ==================== */
  .geography-filter-section {
    margin: 10px 0;
  }

  .geography-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-right: 10px;
  }

  .geography-icons-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .resource-icon-group {
    margin-left: 10px;
    flex-shrink: 0;
  }

  .geography-icon {
    width: 30px;
    height: 30px;
    cursor: pointer;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .geography-icon:hover {
    transform: scale(1.1);
  }

  .geography-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .resource-icon {
    width: 30px;
    height: 30px;
    object-fit: contain;
    transition: transform 0.2s;
  }

  .resource-icon:hover {
    transform: scale(1.1);
  }

  /* Active state for geography icons */
  .geography-icon.active {
    position: relative;
  }

  .geography-icon.active::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #4CAF50;
  }

  /* ==================== BIOME FILTER ==================== */
  .biome-filter-group {
    display: flex;
    gap: 6px;
  }
  
  .biome-filter {
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s;
  }
  
  .biome-filter:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  .biome-filter.active {
    opacity: 1;
    transform: scale(1.1);
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
  }
  
  .biome-filter img {
    width: 24px;
    height: 24px;
  }
  /* ==================== BIOME FILTER ICONS ==================== */
.biome-filter img {
  width: 30px;
  height: 30px;
  vertical-align: middle;
  /* Reduce brightness */
  filter: brightness(0.2); /* Adjust value between 0.5-0.9 as needed */
  opacity: 0.9; /* Optional: adds slight transparency */
  transition: filter 0.2s, opacity 0.2s;
}

/* Make inactive icons even more subtle */
.biome-filter:not(.active) img {
  filter: brightness(0.9) saturate(0.4);
  opacity: 0.8;
}

/* Active state - slightly brighter than default */
.biome-filter.active img {
  filter: brightness(1);
  opacity: 1;
}

  /* ==================== CLEAR FILTERS BUTTON ==================== */
  .clear-filters-btn {
    padding: 8px 16px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
    margin-top: auto;
  }
  
  .clear-filters-btn:hover {
    background: #cc0000;
    transform: scale(1.05);
  }

  /* ==================== RESULTS COUNT ==================== */
  .results-count {
    text-align: center;
    margin-bottom: 16px;
    font-style: italic;
    color: #666;
  }

  /* ==================== DEEDS CONTAINER ==================== */
  .deeds-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }

  /* ==================== DEED TILE ==================== */
  .deed-tile {
    position: relative;
    width: 850px;
    height: 450px;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    background-size: cover;
    background-position: center;
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  /* ==================== DEED TILE ELEMENTS ==================== */
  /* Top Left Elements */
  .special-features {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    gap: 8px;
    z-index: 10;
  }
  
  /* Top Right Elements */
  .worksite-icon-container {
    position: absolute;
    top: 24px;
    right: 14px;
    width: 60px;
    height: 60px;
  }
  
  .worksite-icon {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .worksite-tooltip {
    position: absolute;
    top: 60px;
    right: 0;
    background: rgba(0,0,0,0.7);
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    color: #4169E1;
    min-width: 160px;
    text-align: center;
    z-index: 10;
  }
  
  .emblem-container {
    position: absolute;
    top: 20px;
    right: 90px;
    width: 60px;
    height: 60px;
  }
  
  .emblem-icon {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  .emblem-tooltip {
    position: absolute;
    top: 60px;
    right: 0;
    background: rgba(0,0,0,0.7);
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    color: orange;
    min-width: 160px;
    text-align: center;
  }

  /* Feature Icons */
  .feature-icon-container-BIB {
    position: absolute;
    top: 113px;
    left: 656px;
    width: 32px;
    height: 32px;
  }
  
  .feature-icon-container-UT {
    position: absolute;
    top: 113px;
    left: 632px;
    width: 32px;
    height: 32px;
  }
  
  .feature-icon {
    width: 100%;
    height: 100%;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .feature-icon:hover {
    transform: scale(1.2);
  }
  
  .feature-tooltip {
    position: absolute;
    top: 35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 20;
  }

  /* Right Side Elements */
  .territory-info {
    position: absolute;
    top: 115px;
    right: 10px;
    font-size: 14px;
    text-align: center;
    width: 200px;
  }
  
  .location-info {
    position: absolute;
    top: 140px;
    right: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    font-size: 12px;
    width: 320px;
  }
  
  .location-numbers {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .location-numbers img {
    width: 16px;
    height: 16px;
  }
  
  .production-summary {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: bold;
    font-size: 13px;
  }
  
  .production-summary img {
    width: 18px;
    height: 18px;
  }
  
  .resource-production {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: bold;
    font-size: 13px;
    margin-top: 4px;
  }
  
  .resource-icon {
    width: 18px;
    height: 18px;
  }
  
  .per-hour-label {
    margin-left: 4px;
    font-size: 13px;
    font-weight: normal;
  }

  /* Required DEC Total */
  .required-plot-dec-total {
    position: absolute;
    bottom: 190px;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.7);
    padding: 6px 10px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 14px;
    z-index: 1;
  }

  .required-plot-dec-total .dec-icon {
    width: 30px;
    height: 30px;
  }

  .required-plot-dec-total .required-label {
    font-size: 12px;
    opacity: 0.8;
  }

  /* Bottom Left Elements */
  .terrain-synergies {
    position: absolute;
    bottom: 60px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    padding: 6px 10px;
    border-radius: 4px;
    z-index: 10;
  }
  
  .synergy-label {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #FFD700;
  }
  
  .synergy-icons {
    display: flex;
    gap: 6px;
  }
  
  .synergy-icons img {
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
  }
  
  .synergy-icons img:hover {
    transform: scale(1.3);
  }

  /* Bottom Right Elements */
  .management-button {
    position: absolute;
    bottom: 20px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid #FFD700;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
    transition: all 0.2s;
    z-index: 10;
  }
  
  .management-button:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.05);
  }

  /* ==================== WORKER/BOOST TILES ==================== */
  .slot-tiles-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
    justify-content: center;
    max-height: 200px;
    overflow-y: auto;
    padding: 8px;
    background: rgba(0,0,0,0.5);
    border-radius: 8px;
  }
  
  .worker-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 80px;
  }
  
  .worker-tile {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 2px solid;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }
  
  .worker-tile:hover {
    transform: scale(1.05);
  }
  
  .slot-frame {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  .worker-image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 2;
  }

  .card-name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 4px;
    font-size: 10px;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    z-index: 3;
  }
  
  .rarity-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid white;
    z-index: 3;
  }
  
  .bcx-badge {
    position: absolute;
    top: 2px;
    left: 2px;
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 4px;
    padding: 0 3px;
    font-size: 9px;
    z-index: 3;
  }
  
  .worker-info {
    width: 100%;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 4px;
    border-radius: 4px;
    font-size: 10px;
    text-align: center;
  }
  
  .dec-stake-requirement {
    width: 100%;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 2px;
    border-radius: 4px;
    font-size: 10px;
    text-align: center;
    margin-bottom: 2px;
  }
  
  .pp-base {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
  }
  
  .pp-label {
    font-weight: bold;
  }
  
  .pp-values {
    color: #4CAF50;
  }
  
  .card-uid {
    font-size: 8px;
    opacity: 0.8;
    word-break: break-all;
  }
  
  .boost-tile {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 2px solid;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }
  
  .boost-tile:hover {
    transform: scale(1.05);
  }
  
  .boost-image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 2;
  }
  
  .boost-percent {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 3;
  }
  
  .boost-name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 2px;
    font-size: 10px;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    z-index: 3;
  }

  /* ==================== LOADING AND ERROR STATES ==================== */
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 16px;
    background-color: white;
    color: #333;
    transition: all 0.3s ease;
  }

  .loading-screen.dark-mode {
    background-color: #121212;
    color: #e0e0e0;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 4px solid rgba(0,0,0,0.1);
    border-left-color: #09f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .dark-mode .spinner {
    border-left-color: #4CAF50;
  }
  
  .error-screen {
    padding: 16px;
    margin: 16px;
    background: #ffecec;
    border: 1px solid #ffb3b3;
    border-radius: 4px;
    color: red;
  }

  .dark-mode .error-screen {
    background: #2a1a1a;
    border-color: #5c2e2e;
    color: #ff6b6b;
  }
  
  .retry-btn {
    margin-left: 12px;
    padding: 4px 8px;
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  /* ==================== ANIMATIONS ==================== */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`}</style>
    </div>
  );
}