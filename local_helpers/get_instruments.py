import databento as db

client = db.Historical("YOUR_API_KEY")
data = client.timeseries.get_range(
    dataset="XNAS.ITCH",
    schema="trades",
    symbols="ALL_SYMBOLS",
    start="2024-05-21T15:00",
    end="2024-05-21T15:01",
)

df = data.to_df()

print(f"{len(df):,d} trade(s) for {len(df['instrument_id'].unique()):,d} instrument(s)")