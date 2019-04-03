function mySettings(props) {
  return (
    <Page>
      <Section title={<Text bold align="center">Settings</Text>}>
        <Select
          label={"Time between two bars in the histogram"}
          settingsKey="spacing"
          options={[
            {name:"5 minutes", value:"1000 * 60 * 5"}, 
            {name:"15 minutes", value:"1000 * 60 * 15"},
            {name:"30 minutes", value:"1000 * 60 * 30"},
            {name:"1 hour", value:"1000 * 60 * 60"},
            {name:"2 hours", value:"1000 * 60 * 120"}
          ]}
        />
        <Select
          label={"Date format"}
          settingsKey="format"
          options={[
            {name:"10/03/2018", value:"1"}, 
            {name:"10/03/18", value:"2"},
            {name:"03/10/2018", value:"3"}, 
            {name:"03/10/18", value:"4"},
            {name:"Wed 03 Oct", value:"5"},
            {name:"Wed, Oct 03", value:"6"},
            {name:"2018-10-03", value:"7"}
          ]}
        />

        <Button list label="Clear Settings Storage" onClick={() => props.settingsStorage.clear()}/>
      </Section>
      <Section title={<Text bold align="center">About this application</Text>}>
        <Text>This face shows you 5 indicators as circles completing when a goal is reached. To see your progress over time those are also shown as a graph with a bar every 30 minutes, the frequency can be changed in the settings. The battery level is also visible this way.  Click on the graph to switch display.</Text>
        <Text>This clock face is free and open source:</Text>
        <Link source="https://github.com/cgueret/fitbit-graphs">https://github.com/cgueret/fitbit-graphs</Link>
        <Text>If you would like to support my work, please consider buying me a coffee:</Text>
        <Link source="http://buymeacoff.ee/YOhoMkzD4">http://buymeacoff.ee/YOhoMkzD4</Link>
        <Text>If you would like to support but coffee is not your thing, here is a Paypal link:</Text>
        <Link source="http://paypal.me/cgueret79">http://paypal.me/cgueret79</Link>
        <Text>Thanks!</Text>
      </Section>
      
    </Page>
  );
}

registerSettingsPage(mySettings);
