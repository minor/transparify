


export default function FactError({ statement, error } : { statement: string, error: string }) {
    return (
        <div>
        <h1>{'"' + statement + '":'}</h1>
        <br />
        <h2>{error}</h2>
        </div>
    );
}
