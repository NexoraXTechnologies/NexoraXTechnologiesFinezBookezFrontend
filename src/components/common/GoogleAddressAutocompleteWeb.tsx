import { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        google: any;
    }
}

/* ===================================================
   GOOGLE CONFIG
=================================================== */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

let googlePlacesScriptPromise: Promise<void> | null = null;

const loadGooglePlacesScript = () => {
    if (typeof window === "undefined") return Promise.resolve();

    if (window.google?.maps?.places) {
        return Promise.resolve();
    }

    if (googlePlacesScriptPromise) {
        return googlePlacesScriptPromise;
    }

    googlePlacesScriptPromise = new Promise((resolve, reject) => {
        if (!GOOGLE_API_KEY) {
            reject(new Error("Google Maps API key missing"));
            return;
        }

        const existingScript = document.getElementById("google-places-script");

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve());
            existingScript.addEventListener("error", reject);
            return;
        }

        const script = document.createElement("script");

        script.id = "google-places-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => resolve();
        script.onerror = reject;

        document.body.appendChild(script);
    });

    return googlePlacesScriptPromise;
};

/* ===================================================
   HELPERS
=================================================== */

const normalizeText = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase();

const getDisplayName = (name: any) => {
    if (!name) return "";

    if (typeof name === "string") return name;

    if (typeof name === "object") {
        return (
            name.en ||
            name.mr ||
            name.hi ||
            name.gu ||
            name.ta ||
            name.te ||
            name.kn ||
            name.ml ||
            name.pa ||
            ""
        );
    }

    return String(name);
};

const getAddressComponent = (details: any, type: string) => {
    const component = details?.address_components?.find((item: any) =>
        item?.types?.includes(type)
    );

    return component?.long_name || "";
};

type GoogleAddressAutocompleteWebProps = {
    label?: string;
    placeholder?: string;
    value?: string;
    country?: string;
    disabled?: boolean;
    className?: string;
    stateRecords?: any[];
    cityRecords?: any[];
    onInputChange?: (value: string) => void;
    onSelectAddress?: (address: any) => void;
};

/* ===================================================
   REUSABLE GOOGLE ADDRESS AUTOCOMPLETE WEB
=================================================== */

const GoogleAddressAutocompleteWeb = ({
    label = "Address",
    placeholder = "Enter address",
    value = "",
    country = "in",
    disabled = false,
    className = "",
    stateRecords = [],
    cityRecords = [],
    onInputChange,
    onSelectAddress,
}: GoogleAddressAutocompleteWebProps) => {
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const autocompleteServiceRef = useRef<any>(null);
    const placesServiceRef = useRef<any>(null);
    const placesNodeRef = useRef<HTMLDivElement | null>(null);
    const sessionTokenRef = useRef<any>(null);
    const skipNextSearchRef = useRef(false);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        let mounted = true;

        loadGooglePlacesScript()
            .then(() => {
                if (!mounted) return;

                if (!window.google?.maps?.places) return;

                autocompleteServiceRef.current =
                    new window.google.maps.places.AutocompleteService();

                if (placesNodeRef.current) {
                    placesServiceRef.current =
                        new window.google.maps.places.PlacesService(
                            placesNodeRef.current
                        );
                }

                sessionTokenRef.current =
                    new window.google.maps.places.AutocompleteSessionToken();
            })
            .catch((error) => {
                console.log("[GoogleAddressAutocompleteWeb]", error);
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!autocompleteServiceRef.current || disabled) return;

        if (skipNextSearchRef.current) {
            skipNextSearchRef.current = false;
            setSuggestions([]);
            setOpen(false);
            return;
        }

        const searchText = query.trim();

        if (searchText.length < 2) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        const timer = setTimeout(() => {
            autocompleteServiceRef.current.getPlacePredictions(
                {
                    input: searchText,
                    componentRestrictions: { country },
                    sessionToken: sessionTokenRef.current,
                },
                (predictions: any[] = [], status: any) => {
                    const placesStatus =
                        window.google?.maps?.places?.PlacesServiceStatus;

                    if (
                        status !== placesStatus?.OK ||
                        !Array.isArray(predictions)
                    ) {
                        setSuggestions([]);
                        setOpen(false);
                        return;
                    }

                    setSuggestions(predictions);
                    setOpen(true);
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [query, country, disabled]);

    const findSelectedState = (stateName: string) => {
        const cleanStateName = normalizeText(stateName);

        return (
            stateRecords.find((item: any) => {
                const itemName = normalizeText(
                    getDisplayName(item?.name || item?.stateName)
                );

                return itemName === cleanStateName;
            }) || null
        );
    };

    const findSelectedCity = (cityName: string) => {
        const cleanCityName = normalizeText(cityName);

        return (
            cityRecords.find((item: any) => {
                const itemName = normalizeText(
                    getDisplayName(item?.name || item?.cityName)
                );

                return itemName === cleanCityName;
            }) || null
        );
    };

    const handleSelectSuggestion = (prediction: any) => {
        if (!prediction?.place_id || !placesServiceRef.current) return;

        const selectedDescription = prediction.description || "";

        skipNextSearchRef.current = true;
        setQuery(selectedDescription);
        onInputChange?.(selectedDescription);
        setSuggestions([]);
        setOpen(false);

        placesServiceRef.current.getDetails(
            {
                placeId: prediction.place_id,
                fields: [
                    "address_components",
                    "formatted_address",
                    "geometry",
                    "place_id",
                    "name",
                ],
                sessionToken: sessionTokenRef.current,
            },
            (details: any, status: any) => {
                const placesStatus =
                    window.google?.maps?.places?.PlacesServiceStatus;

                if (status !== placesStatus?.OK || !details) return;

                const fullAddress =
                    details?.formatted_address || prediction?.description || "";

                const city =
                    getAddressComponent(details, "locality") ||
                    getAddressComponent(details, "administrative_area_level_3") ||
                    getAddressComponent(details, "administrative_area_level_2") ||
                    getAddressComponent(details, "sublocality") ||
                    getAddressComponent(details, "sublocality_level_1");

                const stateName = getAddressComponent(
                    details,
                    "administrative_area_level_1"
                );

                const pincode = getAddressComponent(details, "postal_code");

                const lat = details?.geometry?.location?.lat?.();
                const lng = details?.geometry?.location?.lng?.();

                const selectedState = findSelectedState(stateName);
                const selectedCity = findSelectedCity(city);

                skipNextSearchRef.current = true;
                setQuery(fullAddress);
                onInputChange?.(fullAddress);
                setSuggestions([]);
                setOpen(false);

                onSelectAddress?.({
                    fullAddress,
                    city,
                    stateName,
                    pincode,
                    lat,
                    lng,
                    placeId: details.place_id || prediction.place_id,
                    selectedState,
                    selectedCity,
                    rawDetails: details,
                    rawPrediction: prediction,
                });

                sessionTokenRef.current =
                    new window.google.maps.places.AutocompleteSessionToken();
            }
        );
    };

    return (
        <label className={`relative flex min-w-0 flex-col gap-1 ${className}`}>
            <div ref={placesNodeRef} className="hidden" />

            <span className="text-sm font-medium text-card-foreground">
                {label}
            </span>

            <input
                value={query}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onInputChange?.(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => {
                    if (suggestions.length) setOpen(true);
                }}
                onBlur={() => {
                    setTimeout(() => setOpen(false), 180);
                }}
                className="h-8 w-full rounded-sm border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            />

            {open && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[68px] z-[9999] max-h-72 overflow-auto rounded-md border border-border bg-card shadow-xl">
                    {suggestions.map((item: any) => (
                        <button
                            key={item.place_id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectSuggestion(item)}
                            className="flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left transition last:border-b-0 hover:bg-muted"
                        >
                            <span className="text-sm font-medium text-card-foreground">
                                {item.structured_formatting?.main_text ||
                                    item.description}
                            </span>

                            <span className="text-xs text-muted-foreground">
                                {item.structured_formatting?.secondary_text ||
                                    item.description}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </label>
    );
};

export default GoogleAddressAutocompleteWeb;