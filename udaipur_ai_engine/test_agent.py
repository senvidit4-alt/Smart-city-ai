from agent import agent_executor

def test_agent():
    queries = [
        "What's the traffic at Chetak Circle at 6 PM on Monday?",
        "Check waste overflow in Hiran Magri. Density is High and it's been 6 days since the last collection.",
        "What's the weather in Udaipur?"
    ]
    
    for query in queries:
        print(f"Query: {query}")
        try:
            response = agent_executor.invoke({"messages": [("user", query)]})
            print(f"Response: {response['messages'][-1].content}\n")
        except Exception as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    test_agent()
